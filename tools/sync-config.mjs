import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const rootConfigPath = path.join(__dirname, "..", "config.js");
const { FE_URL, API_URL } = require(rootConfigPath);

// Target: frontend/src/config.js
const targetPath = path.join(__dirname, "..", "frontend", "src", "config.js");

const fileContents = `// AUTO-GENERATED FILE. Do not edit.
// Synced from root config.js

export const FE_URL = ${JSON.stringify(FE_URL)};
export const API_URL = ${JSON.stringify(API_URL)};
`;

fs.writeFileSync(targetPath, fileContents, "utf8");

console.log(`Synced ${rootConfigPath} -> ${targetPath}`);
