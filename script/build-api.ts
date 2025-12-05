import { build as esbuild } from "esbuild";
import { readFile } from "fs/promises";

async function buildApi() {
  console.log("Building API function for Vercel...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = Object.keys(pkg.dependencies || {});

  await esbuild({
    entryPoints: ["api/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile: ".vercel/output/functions/index.func/index.mjs",
    external: allDeps, // Mark all dependencies as external
    minify: false,
    sourcemap: true,
    logLevel: "info",
    banner: {
      js: '// Vercel Serverless Function\nimport { createRequire } from "module"; const require = createRequire(import.meta.url);',
    },
  });

  console.log("✓ API function built successfully");
}

buildApi().catch((err) => {
  console.error("Failed to build API function:", err);
  process.exit(1);
});
