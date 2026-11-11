import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { WorkoutStatus } from "./workoutStatus";
import { createNativeQueue } from "./queue";

type WorkoutActivityPlugin = {
  availability(): Promise<{ supported: boolean; enabled: boolean }>;
  update(status: WorkoutStatus & { start?: boolean }): Promise<void>;
  end(): Promise<void>;
};
export const WorkoutActivity =
  registerPlugin<WorkoutActivityPlugin>("WorkoutActivity");
export const isNative = () => Capacitor.isNativePlatform();
const REST_ID = 73002;
// Serialize transitions: an older update must never recreate an ended activity.
export const nativeOperation = createNativeQueue();
export async function cancelRestAlert() {
  await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
  const delivered = await LocalNotifications.getDeliveredNotifications();
  await LocalNotifications.removeDeliveredNotifications({
    notifications: delivered.notifications.filter(
      (item) => item.id === REST_ID,
    ),
  });
}
export async function syncRestAlert(status: WorkoutStatus) {
  await cancelRestAlert();
  if (!status.restUntil || status.restUntil < Date.now() + 1500) return;
  if ((await LocalNotifications.checkPermissions()).display !== "granted")
    return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REST_ID,
        title: "Rest complete",
        body: "Ready for your next set? Open FORGE when you're ready.",
        schedule: { at: new Date(status.restUntil), allowWhileIdle: true },
        extra: { route: "/workouts/active" },
        channelId: "forge-rest",
        smallIcon: "ic_stat_workout",
      },
    ],
  });
}
export async function prepareRestAlerts() {
  if (Capacitor.getPlatform() === "android")
    await LocalNotifications.createChannel({
      id: "forge-rest",
      name: "Rest completion",
      importance: 4,
      description: "Rest alerts for your active workout",
      visibility: 0,
    });
  return (await LocalNotifications.requestPermissions()).display === "granted";
}
