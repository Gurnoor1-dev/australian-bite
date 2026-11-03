import { readFileSync, writeFileSync } from "node:fs";

const path = "store-desktop/src-tauri/gen/android/app/build.gradle.kts";
let gradle = readFileSync(path, "utf8");

if (!gradle.includes("import java.util.Properties")) {
  gradle = "import java.util.Properties\nimport java.io.FileInputStream\n\n" + gradle;
}

if (!gradle.includes('create("release")')) {
  const signing = \`
  signingConfigs {
    create("release") {
      val signingPropertiesFile = rootProject.file("keystore.properties")
      val signingProperties = Properties()
      if (signingPropertiesFile.exists()) {
        signingProperties.load(FileInputStream(signingPropertiesFile))
      }
      keyAlias = signingProperties["keyAlias"] as String
      keyPassword = signingProperties["password"] as String
      storeFile = file(signingProperties["storeFile"] as String)
      storePassword = signingProperties["password"] as String
    }
  }
\`;
  if (!/buildTypes\s*\{/.test(gradle)) throw new Error("Could not find the Android release buildTypes block.");
  gradle = gradle.replace(/buildTypes\s*\{/, signing + "\n  buildTypes {");
}

if (!/signingConfig\s*=\s*signingConfigs\.getByName\("release"\)/.test(gradle)) {
  const releaseBlock = /(getByName\("release"\)\s*\{)/;
  if (releaseBlock.test(gradle)) {
    gradle = gradle.replace(releaseBlock, '$1\n      signingConfig = signingConfigs.getByName("release")');
  } else {
    throw new Error("Could not find the Android release build type to attach the persistent signing key.");
  }
}

writeFileSync(path, gradle);
console.log("Configured the persistent Android release signing key.");
