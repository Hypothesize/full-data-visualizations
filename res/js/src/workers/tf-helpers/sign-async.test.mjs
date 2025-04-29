import {
  apply,
  DataFrame,
  isEqual,
  isNumber,
  normal,
  range,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { sign as oldSign } from "@jrc03c/js-math-tools"
import { tfSignAsync } from "./sign-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that the sign of a number can be correctly identified", async () => {
  expect(await tfSignAsync(-234.567)).toBe(-1)
  expect(await tfSignAsync(234.567)).toBe(1)
  expect(await tfSignAsync(0)).toBe(0)
  expect(await tfSignAsync(Infinity)).toBe(1)
  expect(await tfSignAsync(-Infinity)).toBe(-1)

  const a = normal(100)
  const bTrue = a.map(v => (v < 0 ? -1 : v > 0 ? 1 : 0))
  const bPred = await tfSignAsync(a)
  expect(isEqual(bPred, bTrue)).toBe(true)

  const c = normal([2, 3, 4, 5])
  const dTrue = apply(c, v => (v < 0 ? -1 : v > 0 ? 1 : 0))
  const dPred = await tfSignAsync(c)
  expect(isEqual(dPred, dTrue)).toBe(true)

  const e = new Series({ hello: normal(100) })
  const fTrue = e.copy().apply(v => (v < 0 ? -1 : v > 0 ? 1 : 0))
  const fPred = await tfSignAsync(e)
  expect(isEqual(fPred, fTrue.values)).toBe(true)

  const g = new DataFrame({ foo: normal(100), bar: normal(100) })

  const hTrue = g
    .copy()
    .apply(col => col.apply(v => (v < 0 ? -1 : v > 0 ? 1 : 0)))

  const hPred = await tfSignAsync(g)
  expect(isEqual(hPred, hTrue.values)).toBe(true)

  const i = normal([100, 10])

  range(0, 100).forEach(() => {
    const j = parseInt(Math.random() * i.length)
    const k = parseInt(Math.random() * i[j].length)
    i[j][k] = "oh no!"
  })

  const j = await tfSignAsync(i)

  i.forEach((row, k) => {
    row.forEach((v, l) => {
      if (v === "oh no!") {
        expect(j[k][l]).toBe("oh no!")
      } else {
        expect(isNumber(j[k][l])).toBe(true)
      }
    })
  })

  const wrongs = [
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
      await tfSignAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfSignAsync` is faster than `oldSign` (from @jrc03c/js-math-tools)", async () => {
  const x = normal([300, 300])
  const t1 = await timeAsync(async () => oldSign(x))
  const t2 = await timeAsync(async () => await tfSignAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
