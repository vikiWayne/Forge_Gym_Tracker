package com.forgegym.tracker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.text.DateFormat;
import java.util.Date;

@CapacitorPlugin(name = "WorkoutActivity")
public class WorkoutActivityPlugin extends Plugin {
    static final int NOTIFICATION_ID = 73001;
    static final String CHANNEL = "forge-workout";
    private NotificationManager manager() {
        return (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
    }
    private void channel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Active workout", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Workout duration and checked sets, only when you enable lock-screen status");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            manager().createNotificationChannel(channel);
        }
    }
    @PluginMethod public void availability(PluginCall call) {
        channel();
        boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        if (Build.VERSION.SDK_INT >= 26)
            enabled &= manager().getNotificationChannel(CHANNEL).getImportance() != NotificationManager.IMPORTANCE_NONE;
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("enabled", enabled);
        call.resolve(result);
    }
    @PluginMethod public void update(PluginCall call) {
        String id = call.getString("sessionId", "");
        long now = System.currentTimeMillis();
        long started = number(call, "startedAt", 0);
        long expires = number(call, "expiresAt", 0);
        int total = call.getInt("totalSets", 0);
        int done = call.getInt("completedSets", 0);
        if (id.isEmpty() || started <= 0 || started > now || expires <= now ||
            expires > started + 8 * 60 * 60 * 1000L || total < 1 || done < 0 || done > total) {
            call.reject("Invalid or expired workout status."); return;
        }
        channel();
        if (!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
            call.reject("Workout notifications are disabled."); return;
        }
        String hidden = getContext().getSharedPreferences("workout-status", Context.MODE_PRIVATE).getString("hidden", "");
        if (Boolean.TRUE.equals(call.getBoolean("start", false))) {
            getContext().getSharedPreferences("workout-status", Context.MODE_PRIVATE).edit().remove("hidden").apply();
        } else if (id.equals(hidden)) { call.resolve(); return; }
        Intent open = new Intent(getContext(), MainActivity.class)
            .setAction(Intent.ACTION_VIEW).setData(Uri.parse("forgegym://workout/active"))
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(getContext(), 73001, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent hide = new Intent(getContext(), WorkoutNotificationReceiver.class).putExtra("sessionId", id);
        PendingIntent unpin = PendingIntent.getBroadcast(getContext(), 73001, hide, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String summary = done + "/" + total + " sets · " + clipped(call.getString("exercise", "Training"));
        long restUntil = number(call, "restUntil", 0);
        if (restUntil > now) summary += "\nRest ends " + DateFormat.getTimeInstance(DateFormat.MEDIUM).format(new Date(restUntil));
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(getContext(), CHANNEL) : new Notification.Builder(getContext());
        builder.setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle(clipped(call.getString("title", "Your workout")))
            .setContentText(summary).setStyle(new Notification.BigTextStyle().bigText(summary))
            .setColor(Color.rgb(183, 243, 107)).setWhen(started).setShowWhen(true).setUsesChronometer(true)
            .setProgress(total, done, false).setOngoing(true).setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_PROGRESS).setVisibility(Notification.VISIBILITY_PRIVATE)
            .setContentIntent(tap).setDeleteIntent(unpin)
            .addAction(new Notification.Action.Builder(R.drawable.ic_stat_workout, "Hide", unpin).build());
        Notification.Builder publicBuilder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(getContext(), CHANNEL) : new Notification.Builder(getContext());
        builder.setPublicVersion(publicBuilder.setSmallIcon(R.drawable.ic_stat_workout)
            .setContentTitle("FORGE workout in progress").setContentText("Open FORGE to continue").setContentIntent(tap).build());
        if (Build.VERSION.SDK_INT >= 26) builder.setTimeoutAfter(expires - now);
        if (Build.VERSION.SDK_INT >= 36) builder.setRequestPromotedOngoing(true).setShortCriticalText(done + "/" + total);
        try { manager().notify(NOTIFICATION_ID, builder.build()); call.resolve(); }
        catch (SecurityException error) { call.reject("Allow workout notifications in Settings.", error); }
    }
    @PluginMethod public void end(PluginCall call) {
        manager().cancel(NOTIFICATION_ID);
        call.resolve();
    }
    private long number(PluginCall call, String key, long fallback) {
        Double value = call.getDouble(key);
        return value == null || !Double.isFinite(value) ? fallback : value.longValue();
    }
    private String clipped(String value) { return value.substring(0, Math.min(80, value.length())); }
}
