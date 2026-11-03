import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const rawTag = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const match = rawTag.match(/^store-v(\\d+)\\.0\\.0$/);
if (!match) throw new Error("Installer releases must be major tags such as store-v1.0.0 or store-v2.0.0.");

const version = rawTag.replace(/^store-v/, "");
const versionCode = Number(match[1]) * 10000;

const packagePath = "store-desktop/package.json";
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
packageJson.version = version;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

const configPath = "store-desktop/src-tauri/tauri.conf.json";
const config = JSON.parse(readFileSync(configPath, "utf8"));
config.version = version;
config.bundle = config.bundle || {};
config.bundle.android = { ...(config.bundle.android || {}), minSdkVersion: 24, versionCode };
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");

const cargoPath = "store-desktop/src-tauri/Cargo.toml";
let cargo = readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/(^\[package\][\s\S]*?^version = ")[^"]+(")/m, "$1" + version + "$2");
writeFileSync(cargoPath, cargo);

if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, "VITE_APP_VERSION=" + version + "\n");
console.log("Prepared Australian Bite POS release " + version + " (Android versionCode " + versionCode + ").");
