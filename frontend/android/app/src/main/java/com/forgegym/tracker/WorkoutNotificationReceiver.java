package com.forgegym.tracker;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WorkoutNotificationReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        context.getSharedPreferences("workout-status", Context.MODE_PRIVATE).edit()
            .putString("hidden", intent.getStringExtra("sessionId")).apply();
        ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE))
            .cancel(WorkoutActivityPlugin.NOTIFICATION_ID);
    }
}
