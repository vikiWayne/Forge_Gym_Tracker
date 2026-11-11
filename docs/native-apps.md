# Native apps and lock-screen workouts

FORGE now has Capacitor 8 Android and iOS projects. The PWA remains available, and native builds bundle the same React UI. The native app does not load arbitrary remote pages into its privileged WebView.

## Backend address

Production native builds use the Render HTTPS origin in `frontend/api.config.mjs`. For local phone testing, copy `frontend/.env.example` to `frontend/.env.native-local.local`, set `VITE_LOCAL_API_ORIGIN` to your local HTTPS backend, and run `npm run native:prepare -- --local`. The phone must be able to reach the local host and trust its certificate.

From the repository root:

```sh
npm ci
npm run native:prepare
```

This compiles to `frontend/dist-native`, then copies the result into both native projects. `npm run build` builds the PWA to `frontend/dist`. Re-run native preparation whenever the UI or backend address changes.

API calls use Capacitor's native HTTP transport and native cookie handling; the existing HttpOnly session authentication, origin checks and browser cookie rules remain in place. All request sites, including offline replay, CSV and private photo transfers, use the native-aware transport. Service-worker registration and PWA installation prompts are disabled inside the native container.

## User experience

Start a routine, then tap **Show on lock screen** in the active workout. This explicitly opts in to displaying the workout name, next exercise and completed-set count. It requests notification permission for rest alerts; users can refuse notifications on iOS and still use Live Activities if those are enabled.

- **iOS 16.2+:** ActivityKit Live Activity with a SwiftUI lock-screen card and Dynamic Island presentations. System-rendered timers show rest remaining or elapsed workout time without background JavaScript ticks. The rest countdown holds at zero when finished; a permitted local notification announces completion.
- **Android 8+:** ongoing native notification with OS-rendered elapsed time, set progress and the rest end time. Android 16+ requests Live Update promotion; the OS, device manufacturer and user settings decide whether to promote it. Other devices retain the ordinary notification. A Hide action unpins it without changing workout data.
- Tapping the native card opens the active workout through an allowlisted deep link. Editing/checking sets updates the status. Finish, discard, Pause, Hide from lock screen and sign-out clear the activity and scheduled rest alert. Locking the phone or switching apps leaves the status available.
- Status lifetime is capped at eight hours. Foregrounding the app reconciles it with the active session, including a local unsaved draft. Local alert delivery can be delayed by power-saving settings; exact-alarm permission is not requested.
- Notes, lifted weights, email, credentials, measurements and photos are excluded from activity content. Android supplies a generic public notification when sensitive content is hidden by device settings. iOS marks workout details privacy-sensitive, but lock-screen content should still be treated as visible to others.

No buttons change sets or finish a workout directly from a locked screen in this version. Open FORGE to do those actions. There is no APNs/FCM or Web Push backend in this implementation: cross-device edits cannot update the card while this app is suspended. This is a local activity for the workout on the current device.

## Android build

Install Android Studio, JDK 21 and Android SDK 36, then configure `JAVA_HOME` and the SDK location. After native preparation:

```sh
npm run native:android -w frontend
```

Or run `frontend/android/gradlew :app:assembleDebug` (`gradlew.bat` on Windows). Use Android Studio for emulator/device testing and release signing. The app ID is `com.forgegym.tracker`; choose your owned identifier before store submission. No foreground service, health permission or exact-alarm permission is used for this display-only feature.

## iOS build

Use a Mac with Xcode 26+ and the command-line tools. The project uses Swift Package Manager. After native preparation:

```sh
npm run native:ios -w frontend
```

Open `frontend/ios/App/App.xcodeproj`. Choose your Apple development team for both **App** and **WorkoutWidgets** targets, and update both bundle IDs if needed. The widget target is already embedded and includes the shared attributes definition. `NSSupportsLiveActivities`, the custom bridge controller and URL scheme are configured. `scripts/configure-ios-workout.cjs` can reapply wiring to a freshly generated project; do not regenerate platform folders over customized native code.

## Validation and remaining device checks

The web production build, native-mode web build, Capacitor sync, 38 automated tests, component-size checks and both theme contrast checks passed. Native tests cover minimal data exposure, lifetime boundaries, allowed deep links, HTTPS API configuration and serial update/end ordering.

Actual Java/Swift compilation and phone testing have **not** run in this Windows environment: there is no Java/Android SDK installed and Xcode requires macOS. No signed APK/AAB/IPA has been produced or submitted. Before release, test both platforms for permission denial, lock/unlock, countdown reaching zero, app suspension/termination, cold launch from a card, finishing/discarding, signing out, changing accounts, airplane mode, notification dismissal and eight-hour expiry. Verify login/session persistence, photo upload/download and CSV transfers against the real HTTPS backend as part of that device pass.

Reference: [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup), [Apple Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities), [Android Live Updates](https://developer.android.com/develop/ui/views/notifications/live-update).
