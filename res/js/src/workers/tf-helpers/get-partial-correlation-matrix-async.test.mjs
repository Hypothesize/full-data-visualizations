import {
  float,
  isEqual,
  isNumber,
  max,
  min,
  normal,
  range,
  Series,
  transpose,
} from "@jrc03c/js-math-tools"

import { loadCSV } from "@jrc03c/js-csv-helpers/node"
import { tfGetPartialCorrelationMatrixAsync } from "./get-partial-correlation-matrix-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"
import path from "node:path"

async function isSymmetrical(x) {
  return isEqual(x, transpose(x))
}

test("tests that partial correlation matrices can be computed correctly", async () => {
  const x = float(
    await loadCSV(
      path.join(
        import.meta.dirname,
        "get-partial-correlation-matrix-async-x-from-pingouin.csv",
      ),
    ),
  )

  const pTrue = float(
    await loadCSV(
      path.join(
        import.meta.dirname,
        "get-partial-correlation-matrix-async-p-from-pingouin.csv",
      ),
    ),
  )

  const pPred = await tfGetPartialCorrelationMatrixAsync(x)
  expect(await tfRScoreAsync(pTrue, pPred)).toBeGreaterThan(0.99)

  expect(min(pPred)).toBeGreaterThanOrEqualTo(-1)
  expect(max(pPred)).toBeLessThanOrEqualTo(1)
  expect(await isSymmetrical(pPred))

  pPred.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(true)
    })
  })

  const q = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * q.length)
    const j = parseInt(Math.random() * q[i].length)
    q[i][j] = "oh no!"
  })

  const r = await tfGetPartialCorrelationMatrixAsync(q)

  r.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(true)
    })
  })

  const wrongs = [
    0,
    1,
    2.3,
    -2.3,
    Infinity,
    -Infinity,
    NaN,
    "foo",
    true,
    false,
    null,
    undefined,
    Symbol.for("Hello, world!"),
    [2, 3, 4],
    x => x,
    function (x) {
      return x
    },
    { hello: "world" },
    new Series({ hello: [10, 20, 30, 40, 50] }),
  ]

  for (let i = 0; i < wrongs.length; i++) {
    const value = wrongs[i]
    let failed = false

    try {
      await tfGetPartialCorrelationMatrixAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
