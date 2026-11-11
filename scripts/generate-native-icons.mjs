import { writeFileSync } from "node:fs";
import { iconPng } from "./generate-app-icons.mjs";
const android = "../frontend/android/app/src/main/res/";
for (const [density, size] of [["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192]]) {
  for (const name of ["ic_launcher", "ic_launcher_round"])
    writeFileSync(new URL(`${android}mipmap-${density}/${name}.png`, import.meta.url), iconPng(size));
}
writeFileSync(new URL("../frontend/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", import.meta.url), iconPng(1024, true));
writeFileSync(new URL("../frontend/ios/App/App/Assets.xcassets/Splash.imageset/ForgeSplash.png", import.meta.url), iconPng(1024, true));
console.log("Generated FORGE Android and opaque iOS app icons.");
