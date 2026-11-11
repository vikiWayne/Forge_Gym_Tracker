// One-time, idempotent wiring for the generated Capacitor Xcode project.
const xcode = require("xcode");
const fs = require("node:fs");
const path = require("node:path");
const projectPath = path.join(
  __dirname,
  "../frontend/ios/App/App.xcodeproj/project.pbxproj",
);
const project = xcode.project(projectPath);
project.parseSync();
function clean(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined || child === "undefined") delete value[key];
    else clean(child);
  }
}
clean(project.hash);
const targets = project.pbxNativeTargetSection();
if (
  Object.values(targets).some(
    (t) =>
      typeof t === "object" &&
      String(t.name).replaceAll('"', "") === "WorkoutWidgets",
  )
) {
  console.log("Workout widget target already configured.");
  fs.writeFileSync(projectPath, project.writeSync());
  process.exit(0);
}
const app = project.getFirstTarget().uuid;
const appGroup =
  project.findPBXGroupKey({ name: "App" }) ||
  project.findPBXGroupKey({ path: "App" });
for (const file of ["WorkoutActivityPlugin.swift", "ForgeViewController.swift"])
  project.addSourceFile(file, { target: app }, appGroup);
const group = project.addPbxGroup([], "WorkoutWidgets", "WorkoutWidgets");
project.addToPbxGroup(
  group.uuid,
  project.getFirstProject().firstProject.mainGroup,
);
const sharedGroup = project.addPbxGroup([], "Shared", "Shared");
project.addToPbxGroup(
  sharedGroup.uuid,
  project.getFirstProject().firstProject.mainGroup,
);
const shared = project.addSourceFile(
  "WorkoutAttributes.swift",
  { target: app },
  sharedGroup.uuid,
);
const widget = project.addTarget(
  "WorkoutWidgets",
  "app_extension",
  "WorkoutWidgets",
  "com.forgegym.tracker.workout",
);
project.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", widget.uuid);
project.addBuildPhase([], "PBXFrameworksBuildPhase", "Frameworks", widget.uuid);
project.addBuildPhase([], "PBXResourcesBuildPhase", "Resources", widget.uuid);
project.addSourceFile(
  "WorkoutLiveActivity.swift",
  { target: widget.uuid },
  group.uuid,
);
// Reuse the attributes definition in both binaries, with separate build entries.
const sharedBuild = {
  ...shared,
  uuid: project.generateUuid(),
  target: widget.uuid,
};
project.addToPbxBuildFileSection(sharedBuild);
project.addToPbxSourcesBuildPhase(sharedBuild);
project.addFile("Info.plist", group.uuid);
const list =
  project.pbxXCConfigurationList()[
    widget.pbxNativeTarget.buildConfigurationList
  ];
for (const item of list.buildConfigurations) {
  Object.assign(
    project.pbxXCBuildConfigurationSection()[item.value].buildSettings,
    {
      INFOPLIST_FILE: '"WorkoutWidgets/Info.plist"',
      IPHONEOS_DEPLOYMENT_TARGET: "16.2",
      SWIFT_VERSION: "5.0",
      TARGETED_DEVICE_FAMILY: '"1,2"',
      APPLICATION_EXTENSION_API_ONLY: "YES",
      CODE_SIGN_STYLE: "Automatic",
      CURRENT_PROJECT_VERSION: "1",
      MARKETING_VERSION: "1.0",
      GENERATE_INFOPLIST_FILE: "NO",
    },
  );
}
clean(project.hash);
fs.writeFileSync(projectPath, project.writeSync());
console.log(
  "Configured app bridge, shared attributes and embedded WorkoutWidgets target.",
);
