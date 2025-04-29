import { getCorrelationMatrix as oldGetCorrelationMatrix } from "@jrc03c/js-data-science-helpers"

import {
  identity,
  isEqual,
  isNumber,
  max,
  min,
  normal,
  ones,
  random,
  range,
  Series,
  timeAsync,
  transpose,
} from "@jrc03c/js-math-tools"

import { orthonormalize } from "@jrc03c/js-data-science-helpers"
import { tfGetCorrelationMatrixAsync } from "./get-correlation-matrix-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

async function isSymmetrical(x) {
  return isEqual(x, transpose(x))
}

test("tests that correlation matrices can be computed correctly", async () => {
  const a = [
    [2, 3],
    [4, 5],
    [6, 7],
  ]

  expect(
    await tfRScoreAsync(ones([2, 2]), await tfGetCorrelationMatrixAsync(a)),
  ).toBeGreaterThan(0.99)

  const b = orthonormalize(normal([1000, 5]))
  const cTrue = identity(5)
  const cPred = await tfGetCorrelationMatrixAsync(b)
  expect(await tfRScoreAsync(cTrue, cPred)).toBeGreaterThan(0.99)

  const d = normal([100, 10])
  const eTrue = oldGetCorrelationMatrix(d)
  const ePred = await tfGetCorrelationMatrixAsync(d)
  expect(await tfRScoreAsync(eTrue, ePred)).toBeGreaterThan(0.99)

  expect(min(ePred)).toBeGreaterThanOrEqualTo(-1)
  expect(max(ePred)).toBeLessThanOrEqualTo(1)
  expect(await isSymmetrical(ePred))

  ePred.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(true)
    })
  })

  const f = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * f.length)
    const j = parseInt(Math.random() * f[i].length)
    f[i][j] = "oh no!"
  })

  const g = await tfGetCorrelationMatrixAsync(f)

  g.forEach(row => {
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
      await tfGetCorrelationMatrixAsync(value)
    } catch (d) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfGetCorrelationMatrixAsync` is faster than `oldGetCorrelationMatrix` (from @jrc03c/js-data-science-helpers)", async () => {
  const x = normal([500, 10]).map(row =>
    row.map(v => (random() < 0.001 ? null : v)),
  )

  const t1 = await timeAsync(async () => oldGetCorrelationMatrix(x, x))
  const t2 = await timeAsync(async () => await tfGetCorrelationMatrixAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
