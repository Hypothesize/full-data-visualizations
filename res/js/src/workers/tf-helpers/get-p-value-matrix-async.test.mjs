import {
  DataFrame,
  isNumber,
  normal,
  random,
  range,
  Series,
  set,
  transpose,
} from "@jrc03c/js-math-tools"

import { getPValueMatrix as oldGetPValueMatrix } from "@jrc03c/js-data-science-helpers"
import { tfGetPValueMatrixAsync } from "./get-p-value-matrix-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that p-value matrices can be computed correctly", async () => {
  const a = normal(100)
  const b = transpose(range(0, 5).map(() => a))
  const c = await tfGetPValueMatrixAsync(b)
  const cSet = set(c)
  expect(cSet.length).toBe(1)
  expect(cSet[0]).toBe(1)

  const d = transpose([normal(100), normal(100).map(v => v + 100)])

  const eTrue = [
    [1, 0],
    [0, 1],
  ]

  const ePred = await tfGetPValueMatrixAsync(d)
  expect(await tfRScoreAsync(ePred, eTrue)).toBeGreaterThan(0.99)

  const f = new DataFrame(normal([100, 5]))
  const g1 = await tfGetPValueMatrixAsync(f)
  const g2 = await tfGetPValueMatrixAsync(f.values)
  expect(await tfRScoreAsync(g1, g2)).toBeGreaterThan(0.99)

  const h = normal([10, 10])
  const gPred = await tfGetPValueMatrixAsync(h)
  expect(set(gPred).length).toBeGreaterThan(1)

  gPred.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(true)
    })
  })

  const i = normal([100, 10])
  const jTrue = oldGetPValueMatrix(i)
  const jPred = await tfGetPValueMatrixAsync(i)
  expect(await tfRScoreAsync(jTrue, jPred)).toBeGreaterThan(0.99)

  const k = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(random() * k.length)
    const j = parseInt(random() * k[i].length)
    k[i][j] = "oh no!"
  })

  const l = await tfGetPValueMatrixAsync(k)

  l.forEach(row => {
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
      await tfGetPValueMatrixAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

// =============================================================================
// NOTE: The test below has been disabled because it turns out that the
// @jrc03c/js-data-science-helpers `pValue` function is faster than the
// TensorFlow version!
// =============================================================================

// test("tests that `tfGetPValueMatrixAsync` is faster than `oldGetPValueMatrix` (from @jrc03c/js-data-science-helpers)", async () => {
// 	const a = normal([500, 10]).map(row =>
// 		row.map(v => (random() < 0.001 ? null : v)),
// 	)

// 	const b = normal([500, 15]).map(row =>
// 		row.map(v => (random() < 0.001 ? null : v)),
// 	)

// 	const t1 = await timeAsync(async () => oldGetPValueMatrix(a, b))
// 	const t2 = await timeAsync(async () => await tfGetPValueMatrixAsync(a, b))
// 	expect(t1).toBeGreaterThan(t2)
// })
