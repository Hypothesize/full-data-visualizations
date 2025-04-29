import {
  abs,
  DataFrame,
  mean,
  normal,
  random,
  range,
  reshape,
  Series,
  shape,
  std,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { normalize as oldNormalize } from "@jrc03c/js-data-science-helpers"
import { tfCorrelAsync } from "./correl-async.mjs"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { tfNormalizeAsync } from "./normalize-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that data can be normalized correctly", async () => {
  const a = range(0, 1000).map(() => random())
  const b = await tfNormalizeAsync(a)
  expect(abs(std(b) - 1)).toBeLessThan(0.01)
  expect(abs(mean(b))).toBeLessThan(0.01)

  const c = normal(1000).map(v => v * 100 + 100)
  const d = await tfNormalizeAsync(c)
  expect(abs(std(d) - 1)).toBeLessThan(0.01)
  expect(abs(mean(d))).toBeLessThan(0.01)

  const e = random([2, 3, 4, 5, 6])
  const f = await tfNormalizeAsync(e)
  expect(abs(std(f) - 1)).toBeLessThan(0.01)
  expect(abs(mean(f))).toBeLessThan(0.01)

  const g = new Series({ hello: random(100) })
  const hTrue = g.copy()
  hTrue.values = await tfNormalizeAsync(hTrue.values)
  const hPred = await tfNormalizeAsync(g)
  expect(await tfRScoreAsync(hPred, hTrue)).toBeGreaterThan(0.99)

  const i = new DataFrame({
    foo: random(100),
    bar: random(100),
    baz: random(100),
  })

  const jTrue = i.copy()
  jTrue.values = await tfNormalizeAsync(jTrue.values)
  const jPred = await tfNormalizeAsync(i)
  expect(await tfRScoreAsync(jPred, jTrue)).toBeGreaterThan(0.99)

  const k = normal([2, 3, 4, 5])
  const lTrue = reshape(await tfNormalizeAsync(tf.util.flatten(k)), shape(k))
  const lPred = await tfNormalizeAsync(k)
  expect(await tfRScoreAsync(lTrue, lPred)).toBeGreaterThan(0.99)

  const m = normal(1000)
  const nTrue = oldNormalize(m)
  const nPred = await tfNormalizeAsync(m)
  expect(await tfRScoreAsync(nTrue, nPred)).toBeGreaterThan(0.99)

  const o = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * o.length)
    const j = parseInt(Math.random() * o[i].length)
    o[i][j] = "oh no!"
  })

  const p = await tfNormalizeAsync(o)
  const oClean = await tfDropNaNAsync(o)
  const pClean = await tfDropNaNAsync(p)

  expect(p.some(row => row.some(v => v === "oh no!"))).toBe(true)
  expect(p.length).toBe(o.length)
  expect(await tfCorrelAsync(oClean, pClean)).toBeGreaterThan(0.99)

  o.forEach((row, i) => {
    row.forEach((v, j) => {
      if (v === "oh no!") {
        expect(p[i][j]).toBe("oh no!")
      }
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
    x => x,
    function (x) {
      return x
    },
    { hello: "world" },
  ]

  for (let i = 0; i < wrongs.length; i++) {
    const value = wrongs[i]
    let failed = false

    try {
      await tfNormalizeAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfNormalizeAsync` is faster than `oldNormalize` (from @jrc03c/js-data-science-helpers)", async () => {
  const x = normal([1000, 10])
  const t1 = await timeAsync(async () => oldNormalize(x))
  const t2 = await timeAsync(async () => await tfNormalizeAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
