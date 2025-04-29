import { abs, isNumber, normal, range } from "@jrc03c/js-math-tools"
import { tfCorrelAsync } from "./correl-async.mjs"
import { tfPcaAsync } from "./pca-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"
import fs from "node:fs"
import path from "node:path"

const pcaResultsFromSklearn = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, "pca-async-results-from-sklearn.json"),
    "utf8",
  ),
)

test("test that the `tfPcaAsync` function correctly returns factor loadings and eigenvalues (compare to sklearn's model)", async () => {
  const x = pcaResultsFromSklearn.x
  const loadingsTrue = pcaResultsFromSklearn.loadings

  const eigenvaluesTrue = tf.util
    .flatten(pcaResultsFromSklearn.eigenvalues)
    .filter(v => v > 0)

  const resultsPred = await tfPcaAsync(x)
  const loadingsPred = resultsPred.loadings

  const eigenvaluesPred = tf.util
    .flatten(resultsPred.eigenvalues)
    .filter(v => v > 0)

  expect(
    await tfRScoreAsync(abs(loadingsTrue), abs(loadingsPred)),
  ).toBeGreaterThan(0.99)

  expect(await tfCorrelAsync(eigenvaluesTrue, eigenvaluesPred)).toBeGreaterThan(
    0.99,
  )

  const m = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * m.length)
    const j = parseInt(Math.random() * m[i].length)
    m[i][j] = "oh no!"
  })

  const n = await tfPcaAsync(m)
  expect(tf.util.flatten(n.eigenvalues).every(v => isNumber(v))).toBe(true)
  expect(tf.util.flatten(n.loadings).every(v => isNumber(v))).toBe(true)

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
