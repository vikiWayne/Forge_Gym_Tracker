import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.forgegym.tracker",
  appName: "FORGE",
  webDir: "dist-native",
  backgroundColor: "#111113",
  plugins: {
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      smallIcon: "ic_stat_workout",
      iconColor: "#B7F36B",
    },
  },
};
export default config;
