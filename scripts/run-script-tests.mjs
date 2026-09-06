import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptsDir);
const workspaceSensitiveTest = join(scriptsDir, "grok-pwa-plugin.test.mjs");

const testFiles = (await collectTests(scriptsDir)).sort();
const regularTests = testFiles.filter((file) => file !== workspaceSensitiveTest);

if (regularTests.length > 0) {
  await runNodeTests(regularTests, repositoryRoot, "repository script tests");
}

// This template-oriented suite intentionally checks fallback behaviour when no
// site.json or public/og.jpg exists. Running it from the product workspace makes
// the real 衡研 metadata leak into those fixtures, so give it an empty cwd while
// keeping the test and imported modules at their real absolute paths.
if (testFiles.includes(workspaceSensitiveTest)) {
  const isolatedCwd = await mkdtemp(join(tmpdir(), "stock-analyze-grok-tests-"));
  try {
    await runNodeTests([workspaceSensitiveTest], isolatedCwd, "isolated Grok PWA tests");
  } finally {
    await rm(isolatedCwd, { recursive: true, force: true });
  }
}

async function collectTests(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTests(absolutePath)));
    } else if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      files.push(absolutePath);
    }
  }
  return files;
}

async function runNodeTests(files, cwd, label) {
  const shown = files.map((file) => relative(repositoryRoot, file)).join(", ");
  console.log(`\n[script-tests] ${label}: ${shown}`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--test", ...files], {
      cwd,
      stdio: "inherit",
      env: process.env,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${label} terminated by ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
}
