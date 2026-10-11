import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const cwd = process.cwd();
const abs = path.resolve(cwd);

console.log("===== BUILD DEBUG START =====");
console.log("1. process.cwd():", cwd);
console.log("2. absolute path of process.cwd():", abs);

console.log("3. root directory contents:");
try {
  for (const entry of fs.readdirSync(cwd)) {
    console.log("   -", entry);
  }
} catch (err) {
  console.log("   ERROR reading root:", err.message);
}

const targets = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "app",
  "components",
  "components/ui",
  "components/ui/button.tsx",
  "components/ui/input.tsx",
  "components/ui/label.tsx",
  "lib",
  "lib/api.ts",
  "lib/auth-context.tsx",
];

console.log("4. existence checks:");
for (const target of targets) {
  const full = path.join(cwd, target);
  console.log("   ", target, "=>", fs.existsSync(full) ? "EXISTS" : "MISSING", `(${full})`);
}

console.log("5. complete tsconfig.json:");
try {
  console.log(fs.readFileSync(path.join(cwd, "tsconfig.json"), "utf8"));
} catch (err) {
  console.log("   ERROR reading tsconfig.json:", err.message);
}

console.log("6. complete package.json:");
try {
  console.log(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
} catch (err) {
  console.log("   ERROR reading package.json:", err.message);
}

console.log("7. installed Next.js version:");
try {
  const nextPkgPath = require.resolve("next/package.json", { paths: [cwd] });
  const nextPkg = JSON.parse(fs.readFileSync(nextPkgPath, "utf8"));
  console.log("   next:", nextPkg.version, `(${nextPkgPath})`);
} catch (err) {
  console.log("   ERROR resolving next:", err.message);
}

console.log("8. Node version:", process.version);
console.log("===== BUILD DEBUG END =====");
