import ActivityKit
import SwiftUI
import WidgetKit

@main
struct ForgeWorkoutWidgets: WidgetBundle {
    var body: some Widget { WorkoutLiveActivity() }
}

struct WorkoutLiveActivity: Widget {
    private let accent = Color(red: 183 / 255, green: 243 / 255, blue: 107 / 255)
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("FORGE", systemImage: "dumbbell.fill").font(.caption.weight(.bold)).foregroundStyle(accent)
                    Spacer()
                    Text("\(context.state.completedSets)/\(context.state.totalSets) sets").font(.subheadline.weight(.semibold))
                }
                Text(context.state.title).font(.headline).lineLimit(1).privacySensitive()
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.isStale ? "Open FORGE to refresh" : context.state.exercise)
                            .font(.subheadline).lineLimit(1).privacySensitive()
                        Text("Tap to return to your workout").font(.caption).foregroundStyle(.secondary)
                    }
                    Spacer(minLength: 16)
                    WorkoutClock(state: context.state, stale: context.isStale)
                        .font(.title2.weight(.bold)).foregroundStyle(accent).frame(width: 90)
                }
                ProgressView(value: Double(context.state.completedSets), total: Double(max(1, context.state.totalSets)))
                    .tint(accent).accessibilityLabel("Completed sets")
            }
            .padding(16)
            .activityBackgroundTint(Color(red: 17 / 255, green: 17 / 255, blue: 19 / 255))
            .activitySystemActionForegroundColor(.white)
            .foregroundStyle(.white)
            .widgetURL(URL(string: "forgegym://workout/active"))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("FORGE", systemImage: "dumbbell.fill").foregroundStyle(accent)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.completedSets)/\(context.state.totalSets) sets").monospacedDigit()
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.state.exercise).lineLimit(1).privacySensitive()
                        Spacer()
                        WorkoutClock(state: context.state, stale: context.isStale).frame(width: 90)
                    }
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill").foregroundStyle(accent)
            } compactTrailing: {
                Text("\(context.state.completedSets)/\(context.state.totalSets)").font(.caption).monospacedDigit()
            } minimal: {
                Image(systemName: "dumbbell.fill").foregroundStyle(accent)
            }
            .widgetURL(URL(string: "forgegym://workout/active"))
            .keylineTint(accent)
        }
    }
}

private struct WorkoutClock: View {
    let state: WorkoutAttributes.ContentState
    let stale: Bool
    var body: some View {
        VStack(spacing: 3) {
            if stale { Text("—") }
            else if let rest = state.restUntil {
                Text(timerInterval: Date(timeIntervalSince1970: state.startedAt / 1000)...Date(timeIntervalSince1970: rest / 1000), countsDown: true)
                    .monospacedDigit().accessibilityLabel("Rest remaining")
            } else {
                Text(timerInterval: Date(timeIntervalSince1970: state.startedAt / 1000)...Date(timeIntervalSince1970: state.expiresAt / 1000), countsDown: false)
                    .monospacedDigit().accessibilityLabel("Workout duration")
            }
            Text(state.restUntil == nil ? "TRAINING" : "REST").font(.system(size: 9, weight: .semibold))
        }
    }
}
