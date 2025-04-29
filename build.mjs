import { execSync } from "node:child_process"
import { watch } from "@jrc03c/watch"
import process from "node:process"

function exec(command) {
  return execSync(command, { encoding: "utf8" })
}

function rebuild(file) {
  if (isBuilding) {
    return
  }

  isBuilding = true
  console.log("-----")
  console.log(`Rebuilding... (${new Date().toLocaleString()})`)

  try {
    const shouldRunAllCommands = !file
    file = file || ""

    const coreCommands = [`mkdir -p dist/worker-bundles`, `rm -rf dist/*`]

    const iifeCommands = [
      `npx esbuild res/js/src/iife.mjs --bundle --outfile=dist/hypothesize-visualizations.js`,
      `npx esbuild res/js/src/iife.mjs --bundle --minify --outfile=dist/hypothesize-visualizations.min.js`,
    ]

    const workerCommands = [
      `npx esbuild res/js/src/workers/get-variable-distributions/index.mjs --bundle --outfile=dist/worker-bundles/get-variable-distributions.js`,
      `npx esbuild res/js/src/workers/get-data-types.mjs --bundle --outfile=dist/worker-bundles/get-data-types.js`,
      `npx esbuild res/js/src/workers/get-k-means-results.mjs --bundle --outfile=dist/worker-bundles/get-k-means-results.js`,
      `npx esbuild res/js/src/workers/get-numbers-only-data.mjs --bundle --outfile=dist/worker-bundles/get-numbers-only-data.js`,
      `npx esbuild res/js/src/workers/get-p-values.mjs --bundle --outfile=dist/worker-bundles/get-p-values.js`,
      `npx esbuild res/js/src/workers/get-partial-correlations.mjs --bundle --outfile=dist/worker-bundles/get-partial-correlations.js`,
      `npx esbuild res/js/src/workers/get-pca-loadings.mjs --bundle --outfile=dist/worker-bundles/get-pca-loadings.js`,
      `npx esbuild res/js/src/workers/get-regular-correlations.mjs --bundle --outfile=dist/worker-bundles/get-regular-correlations.js`,
    ]

    const demoCommands = [
      `npx esbuild demo/src/main.mjs --bundle --outfile=demo/bundle.js`,
    ]

    if (shouldRunAllCommands) {
      for (const command of coreCommands) {
        exec(command)
      }
    }

    let alreadyRanDemoCommands = false

    if (file.includes("res/js/src") || shouldRunAllCommands) {
      if (shouldRunAllCommands) {
        for (const command of iifeCommands.concat(workerCommands)) {
          exec(command)
        }
      } else if (file.includes("workers")) {
        for (const command of workerCommands) {
          exec(command)
        }
      } else {
        for (const command of iifeCommands) {
          exec(command)
        }

        for (const command of demoCommands) {
          exec(command)
        }

        alreadyRanDemoCommands = true
      }
    }

    if (
      !alreadyRanDemoCommands &&
      (file.includes("demo") || shouldRunAllCommands)
    ) {
      for (const command of demoCommands) {
        exec(command)
      }
    }

    console.log("\nDone! 🎉\n")
  } catch (e) {
    console.error(e)
  }

  isBuilding = false
}

if (process.argv.includes("-w") || process.argv.includes("--watch")) {
  watch({
    target: "res/js/src",
    created: rebuild,
    modified: rebuild,
    deleted: rebuild,
  })

  watch({
    target: "demo",
    exclude: ["bundle.js"],
    created: rebuild,
    modified: rebuild,
    deleted: rebuild,
  })
}

let isBuilding = false
rebuild()
