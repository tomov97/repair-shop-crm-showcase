/**
 * Applies the Bulgarian -> English string map across apps/web/src for the
 * public demo build. Longest keys first so short strings never corrupt longer
 * ones that contain them.
 *
 * Usage: node scripts/translate-demo.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { TRANSLATIONS } from "./translations.mjs";

const root = "apps/web/src";
const keys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);

let filesChanged = 0;
let replacements = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;

    const original = fs.readFileSync(full, "utf8");
    let text = original;

    for (const key of keys) {
      if (!text.includes(key)) continue;
      const count = text.split(key).length - 1;
      text = text.split(key).join(TRANSLATIONS[key]);
      replacements += count;
    }

    if (text !== original) {
      fs.writeFileSync(full, text);
      filesChanged += 1;
    }
  }
}

walk(root);

console.log(`${replacements} replacements across ${filesChanged} files.`);

// Report anything left behind so nothing ships half-translated.
const leftovers = [];
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/[Ѐ-ӿ]/.test(line)) leftovers.push(`${full}:${index + 1}: ${line.trim()}`);
    });
  }
}
scan(root);

if (leftovers.length > 0) {
  console.log(`\n${leftovers.length} lines still contain Cyrillic:`);
  for (const line of leftovers) console.log(`  ${line}`);
} else {
  console.log("No Cyrillic left in apps/web/src.");
}
