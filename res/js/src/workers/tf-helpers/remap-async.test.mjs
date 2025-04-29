import {
  DataFrame,
  isNumber,
  max,
  min,
  normal,
  random,
  range,
  reshape,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { remap as oldRemap } from "@jrc03c/js-math-tools"
import { tfCorrelAsync } from "./correl-async.mjs"
import { tfRemapAsync } from "./remap-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that values can be remapped correctly from one range to another", async () => {
  expect(await tfRemapAsync(5, 0, 10, 0, 100)).toBe(50)
  expect(await tfRemapAsync(2.5, -10, 10, 64, 104)).toBe(89)
  expect(await tfRemapAsync(1, 0, 10, 10, 0)).toBe(9)

  const a = normal(100)
  const b = normal()
  const c = normal()
  const d = normal()
  const e = normal()

  const fTrue = await tfRemapAsync(a, b, c, d, e)
  const fPred = []

  for (let i = 0; i < a.length; i++) {
    fPred.push(await tfRemapAsync(a[i], b, c, d, e))
  }

  expect(await tfRScoreAsync(fTrue, fPred)).toBeGreaterThan(0.99)

  expect(await tfRemapAsync(1, 1, 1, 1, 1)).toBeNaN()

  const k = normal([2, 3, 4, 5])
  const kMin = min(k)
  const kMax = max(k)
  const kFlat = tf.util.flatten(k)

  const lTemp = []

  for (let i = 0; i < kFlat.length; i++) {
    lTemp.push(await tfRemapAsync(kFlat[i], kMin, kMax, 50, 100))
  }

  const lTrue = reshape(lTemp, [2, 3, 4, 5])
  const lPred = await tfRemapAsync(k, 50, 100)
  expect(await tfRScoreAsync(lPred, lTrue)).toBeGreaterThan(0.99)

  const m = normal([2, 3, 4, 5])
  const n = await tfRemapAsync(m, 0, 1)
  expect(min(n)).toBeGreaterThanOrEqualTo(0)
  expect(max(n)).toBeLessThanOrEqualTo(1)

  const o = new DataFrame(normal([25, 25]))

  expect(
    await tfRScoreAsync(
      await tfRemapAsync(o, 0, 100),
      await tfRemapAsync(o.values, 0, 100),
    ),
  ).toBeGreaterThan(0.99)

  const p = new Series(normal(100))

  expect(
    await tfRScoreAsync(
      await tfRemapAsync(p, -20, -10, 10, 20),
      await tfRemapAsync(p.values, -20, -10, 10, 20),
    ),
  ).toBeGreaterThan(0.99)

  const q = normal(1000)
  const r = normal()
  const s = normal()
  const t = normal()
  const u = normal()

  expect(
    await tfRScoreAsync(
      oldRemap(q, r, s, t, u),
      await tfRemapAsync(q, r, s, t, u),
    ),
  ).toBeGreaterThan(0.99)

  const v = normal(1000)

  range(0, 100).forEach(() => {
    v[parseInt(Math.random() * v.length)] = "oh no!"
  })

  const w = await tfRemapAsync(v, 0, 100)
  expect(await tfCorrelAsync(v, w)).toBeGreaterThan(0.99)

  v.forEach((v1, i) => {
    if (v1 === "oh no!") {
      expect(w[i]).toBe("oh no!")
    } else {
      expect(isNumber(w[i])).toBe(true)
    }
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

  for (let i = 0; i < 100; i++) {
    const vals = range(0, 5).map(
      () => wrongs[parseInt(Math.random() * wrongs.length)],
    )

    let failed = false

    try {
      await tfRemapAsync(...vals)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfRemapAsync` is faster than `oldRemap` (from @jrc03c/js-math-tools)", async () => {
  const x = random(10000)
  const a = 0
  const b = 1
  const c = -1000
  const d = 1000
  const t1 = await timeAsync(async () => oldRemap(x, a, b, c, d))
  const t2 = await timeAsync(async () => await tfRemapAsync(x, a, b, c, d))
  expect(t1).toBeGreaterThan(t2)
})
