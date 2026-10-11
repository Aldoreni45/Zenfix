import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const cwd = process.cwd();

console.log("===== BUILD DIAGNOSTIC START =====");

// ── 1. package.json typescript fields ──────────────────────────────────────────
console.log("\n── 1. package.json typescript fields ──");
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
  console.log("   dependencies.typescript    :", pkg.dependencies?.typescript ?? "(not present)");
  console.log("   devDependencies.typescript :", pkg.devDependencies?.typescript ?? "(not present)");
} catch (err) {
  console.log("   ERROR reading package.json:", err.message);
}

// ── 2. NODE_ENV ─────────────────────────────────────────────────────────────────
console.log("\n── 2. process.env.NODE_ENV ──");
console.log("   NODE_ENV:", process.env.NODE_ENV ?? "(unset)");

// ── 3. process.cwd() ────────────────────────────────────────────────────────────
console.log("\n── 3. process.cwd() ──");
console.log("  ", cwd);

// ── 4. existsSync checks ────────────────────────────────────────────────────────
console.log("\n── 4. existsSync checks ──");
const nmTs    = path.join(cwd, "node_modules", "typescript");
const nmTsPkg = path.join(cwd, "node_modules", "typescript", "package.json");
console.log('   existsSync("node_modules/typescript")             :', fs.existsSync(nmTs));
console.log('   existsSync("node_modules/typescript/package.json") :', fs.existsSync(nmTsPkg));

// ── 5. npm ls typescript --depth=0 ──────────────────────────────────────────────
console.log("\n── 5. npm ls typescript --depth=0 ──");
try {
  const out = execSync("npm ls typescript --depth=0", {
    cwd,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  console.log(out.trim());
} catch (err) {
  // npm ls exits non-zero when package is extraneous/missing; still print stdout
  const stdout = (err.stdout ?? "").trim();
  const stderr = (err.stderr ?? "").trim();
  if (stdout) console.log(stdout);
  if (stderr) console.log("   stderr:", stderr);
  console.log("   exit code:", err.status);
}

// ── 6. node_modules/typescript/package.json version ────────────────────────────
console.log("\n── 6. node_modules/typescript/package.json version ──");
if (fs.existsSync(nmTsPkg)) {
  try {
    const tsPkg = JSON.parse(fs.readFileSync(nmTsPkg, "utf8"));
    console.log("   version:", tsPkg.version);
  } catch (err) {
    console.log("   ERROR parsing typescript/package.json:", err.message);
  }
} else {
  console.log("   node_modules/typescript/package.json does NOT exist.");
}

// ── 7. tsconfig verification ────────────────────────────────────────────────────
console.log("\n── 7. tsconfig verification ──");
const tsconfigPath = path.join(cwd, "tsconfig.json");
console.log('   existsSync("tsconfig.json"):', fs.existsSync(tsconfigPath));
let rawTsconfig = null;
try {
  rawTsconfig = fs.readFileSync(tsconfigPath, "utf8");
  console.log("   tsconfig.json contents:\n", rawTsconfig);
} catch (err) {
  console.log("   ERROR reading tsconfig.json:", err.message);
}
// Parse baseUrl and paths via TS API if available, otherwise raw JSON
try {
  const tsLibPath = require.resolve("typescript/lib/typescript.js", { paths: [cwd] });
  const ts = require(tsLibPath);
  const read = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (read.error) {
    console.log("   ts.readConfigFile ERROR:", JSON.stringify(read.error));
  } else {
    const parsed = ts.parseJsonConfigFileContent(
      read.config,
      ts.sys,
      path.dirname(tsconfigPath),
      undefined,
      tsconfigPath
    );
    console.log("   baseUrl (parsed) :", JSON.stringify(parsed.options.baseUrl ?? null));
    console.log("   paths   (parsed) :", JSON.stringify(parsed.options.paths ?? null));
  }
} catch (_tsErr) {
  if (rawTsconfig) {
    try {
      const obj = JSON.parse(rawTsconfig);
      console.log("   baseUrl (raw JSON):", JSON.stringify(obj.compilerOptions?.baseUrl ?? null));
      console.log("   paths   (raw JSON):", JSON.stringify(obj.compilerOptions?.paths ?? null));
    } catch {
      console.log("   Could not parse tsconfig.json as JSON.");
    }
  }
  console.log("   (TypeScript API unavailable for deep parse — typescript not resolvable)");
}

// ── 8. require.resolve("typescript/package.json") ──────────────────────────────
console.log('\n── 8. require.resolve("typescript/package.json") ──');
try {
  const resolved = require.resolve("typescript/package.json", { paths: [cwd] });
  console.log("  ", resolved);
} catch (err) {
  console.log("   FAILED:", err.message);
}

// ── 9. require.resolve("next/package.json") ─────────────────────────────────────
console.log('\n── 9. require.resolve("next/package.json") ──');
try {
  const resolved = require.resolve("next/package.json", { paths: [cwd] });
  console.log("  ", resolved);
} catch (err) {
  console.log("   FAILED:", err.message);
}

// ── 10. require.resolve("./components/ui/button.tsx") ───────────────────────────
console.log('\n── 10. require.resolve("./components/ui/button.tsx") ──');
try {
  const resolved = require.resolve(path.join(cwd, "components", "ui", "button.tsx"), {
    paths: [cwd],
  });
  console.log("  ", resolved);
} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    console.log("   Node cannot resolve TSX directly — require() does not handle .tsx extensions natively.");
  } else {
    console.log("   FAILED:", err.message);
  }
}

// ── bonus: npm install environment flags ─────────────────────────────────────────
console.log("\n── bonus: npm install environment ──");
console.log("   npm_config_omit       :", process.env.npm_config_omit ?? "(unset)");
console.log("   npm_config_production :", process.env.npm_config_production ?? "(unset)");
console.log("   npm_config_dev        :", process.env.npm_config_dev ?? "(unset)");
for (const key of Object.keys(process.env).sort()) {
  if (/^npm(_config|_execpath|_node_execpath|_command)/i.test(key)) {
    console.log(`   ${key}:`, process.env[key]);
  }
}

console.log("\n===== BUILD DIAGNOSTIC END =====\n");
