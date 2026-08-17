import fs from "node:fs";
import path from "node:path";

const root = "apps/web/src";
const out = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, "utf8");

    for (const match of text.matchAll(/(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g)) {
      if (/[Ѐ-ӿ]/.test(match[2])) out.add(match[2]);
    }
    for (const match of text.matchAll(/>([^<>{}]*[Ѐ-ӿ][^<>{}]*)</g)) {
      const value = match[1].trim();
      if (value) out.add(value);
    }
  }
}

walk(root);
const list = [...out].sort();
fs.writeFileSync("scripts/.strings.json", JSON.stringify(list, null, 1));
console.log(`${list.length} unique strings`);
