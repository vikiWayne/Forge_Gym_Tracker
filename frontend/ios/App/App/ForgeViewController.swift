import Capacitor

class ForgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WorkoutActivityPlugin())
    }
}
