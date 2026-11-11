import Capacitor
import ActivityKit
import UIKit

@objc(WorkoutActivityPlugin)
public class WorkoutActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WorkoutActivityPlugin"
    public let jsName = "WorkoutActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "availability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    @objc func availability(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            call.resolve(["supported": true, "enabled": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["supported": false, "enabled": false])
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.reject("Live Activities require iOS 16.2 or later."); return
        }
        guard let id = call.getString("sessionId"), !id.isEmpty,
              let started = call.getDouble("startedAt"), started.isFinite,
              let expires = call.getDouble("expiresAt"), expires.isFinite,
              let total = call.getInt("totalSets"), total > 0,
              let done = call.getInt("completedSets"), done >= 0, done <= total else {
            call.reject("Invalid workout status."); return
        }
        let now = Date().timeIntervalSince1970 * 1000
        guard started <= now, expires > now, expires <= started + 28_800_000 else {
            call.reject("Workout status has expired."); return
        }
        let rest = call.getDouble("restUntil")
        let state = WorkoutAttributes.ContentState(
            title: String((call.getString("title") ?? "Your workout").prefix(80)),
            exercise: String((call.getString("exercise") ?? "Training").prefix(80)),
            startedAt: started, expiresAt: expires,
            restUntil: rest.flatMap { $0.isFinite && $0 > now ? min($0, expires) : nil },
            completedSets: done, totalSets: total
        )
        Task { @MainActor in
            let content = ActivityContent(state: state, staleDate: Date(timeIntervalSince1970: expires / 1000))
            var existing: Activity<WorkoutAttributes>?
            for activity in Activity<WorkoutAttributes>.activities {
                if activity.attributes.sessionId == id { existing = activity }
                else { await activity.end(nil, dismissalPolicy: .immediate) }
            }
            if let activity = existing {
                await activity.update(content)
                call.resolve()
            } else {
                guard UIApplication.shared.applicationState == .active else {
                    call.reject("Open FORGE to start its Live Activity."); return
                }
                do {
                    _ = try Activity.request(attributes: WorkoutAttributes(sessionId: id), content: content, pushType: nil)
                    call.resolve()
                } catch { call.reject("Unable to start Live Activity: \(error.localizedDescription)") }
            }
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        Task { @MainActor in
            for activity in Activity<WorkoutAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            call.resolve()
        }
    }
}
