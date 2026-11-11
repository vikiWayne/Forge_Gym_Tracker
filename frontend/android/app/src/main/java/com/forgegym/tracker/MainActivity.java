package com.forgegym.tracker;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WorkoutActivityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
