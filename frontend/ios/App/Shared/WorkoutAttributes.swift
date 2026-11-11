import ActivityKit
import Foundation

@available(iOS 16.2, *)
struct WorkoutAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let title: String
        let exercise: String
        let startedAt: Double
        let expiresAt: Double
        let restUntil: Double?
        let completedSets: Int
        let totalSets: Int
    }
    let sessionId: String
}
