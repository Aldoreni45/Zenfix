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

console.log("9. TypeScript readiness (drives tsconfig paths for webpack):");
try {
  const tsPkgPath = require.resolve("typescript/package.json", { paths: [cwd] });
  const tsPkg = JSON.parse(fs.readFileSync(tsPkgPath, "utf8"));
  console.log("   typescript resolved:", tsPkg.version, `(${tsPkgPath})`);
  try {
    const tsLibPath = require.resolve("typescript/lib/typescript.js", { paths: [cwd] });
    console.log("   typescript/lib/typescript.js => OK", `(${tsLibPath})`);
    const ts = require(tsLibPath);
    const tsConfigPath = path.join(cwd, "tsconfig.json");
    const read = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
    if (read.error) {
      console.log("   ts.readConfigFile ERROR:", JSON.stringify(read.error));
    } else {
      const parsed = ts.parseJsonConfigFileContent(
        read.config,
        ts.sys,
        path.dirname(tsConfigPath),
        undefined,
        tsConfigPath
      );
      console.log("   parsed compilerOptions.baseUrl:", JSON.stringify(parsed.options.baseUrl));
      console.log("   parsed compilerOptions.paths:", JSON.stringify(parsed.options.paths));
      if (parsed.options.baseUrl) {
        console.log("   resolvedBaseUrl (as Next computes it):", path.resolve(cwd, parsed.options.baseUrl));
      } else {
        console.log("   resolvedBaseUrl: implicit =>", path.dirname(tsConfigPath));
      }
    }
  } catch (err) {
    console.log("   typescript/lib/typescript.js => FAILED TO LOAD:", err.message);
  }
} catch (err) {
  console.log("   typescript => NOT RESOLVABLE:", err.message);
  console.log("   => Next loadJsConfig will set useTypeScript=false and return empty paths (alias @ breaks).");
}
console.log("   jsconfig.json exists:", fs.existsSync(path.join(cwd, "jsconfig.json")));

console.log("10. install size:");
try {
  const nm = path.join(cwd, "node_modules");
  const nmEntries = fs.readdirSync(nm);
  console.log("   node_modules top-level entries:", nmEntries.length);
  console.log("   node_modules/typescript exists:", fs.existsSync(path.join(nm, "typescript")));
  console.log("   node_modules/typescript-eslint exists:", fs.existsSync(path.join(nm, "typescript-eslint")));
  console.log("   node_modules/eslint exists:", fs.existsSync(path.join(nm, "eslint")));
  console.log("   node_modules/@types exists:", fs.existsSync(path.join(nm, "@types")));
} catch (err) {
  console.log("   ERROR listing node_modules:", err.message);
}
try {
  const lockPkg = JSON.parse(fs.readFileSync(path.join(cwd, "package-lock.json"), "utf8"));
  console.log("   package-lock.json packages count:", Object.keys(lockPkg.packages || {}).length);
} catch (err) {
  console.log("   ERROR reading package-lock.json:", err.message);
}

console.log("11. build environment:");
console.log("   NODE_ENV:", process.env.NODE_ENV || "(unset)");
console.log("   npm_config_omit:", process.env.npm_config_omit || "(unset)");
console.log("   npm_config_production:", process.env.npm_config_production || "(unset)");
console.log("   npm_config_dev:", process.env.npm_config_dev || "(unset)");
for (const key of Object.keys(process.env).sort()) {
  if (/^npm(_config|_execpath|_node_execpath|_command)/i.test(key)) {
    console.log(`   ${key}:`, process.env[key]);
  }
}
console.log("===== BUILD DEBUG END =====");
