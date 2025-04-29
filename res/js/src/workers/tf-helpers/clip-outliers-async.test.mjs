import {
  DataFrame,
  int,
  isEqual,
  median,
  normal,
  ones,
  random,
  range,
  reshape,
  Series,
  timeAsync,
  zeros,
} from "@jrc03c/js-math-tools"

import { OutlierMitigator } from "@jrc03c/js-data-science-helpers"
import { tfClipOutliersAsync } from "./clip-outliers-async.mjs"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that outliers can be correctly clipped", async () => {
  expect(isEqual(await tfClipOutliersAsync(zeros(100)), zeros(100))).toBe(true)
  expect(isEqual(await tfClipOutliersAsync(ones(100)), ones(100))).toBe(true)

  expect(isEqual(await tfClipOutliersAsync(range(0, 100)), range(0, 100))).toBe(
    true,
  )

  expect(
    isEqual(
      await tfClipOutliersAsync(range(0, 10).concat([1000])),
      range(0, 11),
    ),
  ).toBe(false)

  const a = [1, 2, 3, 4, 1000]
  const aMed = median(a)
  const aMad = median(a.map(v => Math.abs(v - aMed)))
  const bTrue = [1, 2, 3, 4, aMed + 5 * aMad]
  const bPred = await tfClipOutliersAsync(a)
  expect(isEqual(bPred, bTrue)).toBe(true)

  const c = random(1000)

  expect(await tfRScoreAsync(c, await tfClipOutliersAsync(c))).toBeGreaterThan(
    0.99,
  )

  const d = reshape(
    normal(1000).map(v => (Math.random() < 0.05 ? 1e20 : v)),
    [10, 10, 10],
  )

  const dMed = median(d)
  const dMad = median(tf.util.flatten(d).map(v => Math.abs(v - dMed)))

  tf.util.flatten(await tfClipOutliersAsync(d)).forEach(v => {
    expect(v - dMed - 5 * dMad).toBeLessThan(0.0001)
    expect(dMed - 5 * dMad - v).toBeLessThan(0.0001)
  })

  const e = new Series({ hello: normal(100) })
  const fTrue = e.copy()
  fTrue.values = await tfClipOutliersAsync(fTrue.values)
  const fPred = await tfClipOutliersAsync(e)
  expect(await tfRScoreAsync(fPred, fTrue)).toBeGreaterThan(0.99)

  const g = new DataFrame({ foo: normal(100), bar: normal(100) })
  const hTrue = new DataFrame(await tfClipOutliersAsync(g.values))
  hTrue.columns = g.columns.slice()
  const hPred = await tfClipOutliersAsync(g)
  expect(await tfRScoreAsync(hPred, hTrue)).toBeGreaterThan(0.99)

  const i = [2, 3, 4, 1000, "foo"]

  expect(
    isEqual(await tfClipOutliersAsync(i), [NaN, NaN, NaN, NaN, NaN]),
  ).not.toBe(true)

  const j = normal(1000)

  range(0, 100).map(() => {
    j[int(random() * j.length)] = (random() < 0.5 ? -1 : 1) * 999999
  })

  const oldGator = new OutlierMitigator()
  const kTrue = oldGator.fitAndTransform(j)
  const kPred = await tfClipOutliersAsync(j)
  expect(await tfRScoreAsync(kTrue, kPred)).toBeGreaterThan(0.99)
  expect(await tfRScoreAsync(kTrue, j)).toBeLessThan(0.5)

  const l = random(1000)

  range(0, 100).forEach(() => {
    l[int(random() * l.length)] = "oh no!"
  })

  const m = await tfClipOutliersAsync(l)
  const lClean = await tfDropNaNAsync(l)
  const mClean = await tfDropNaNAsync(m)

  expect(await tfRScoreAsync(lClean, mClean)).toBeGreaterThan(0.99)
  expect(lClean.length).toBeLessThan(l.length)

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
    for (let j = 0; j < wrongs.length; j++) {
      const v1 = wrongs[i]
      const v2 = wrongs[j]
      let failed = false

      try {
        await tfClipOutliersAsync(v1, v2)
      } catch (e) {
        failed = true
      }

      expect(failed).toBe(true)
    }
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfClipOutliersAsync` runs faster than the `OutlierMitigator` (from @jrc03c/js-data-science-helpers)", async () => {
  const x = random(10000).map(v => (random() < 0.001 ? v * 1000 : v))

  const t1 = await timeAsync(async () => {
    new OutlierMitigator().fitAndTransform(x)
  })

  const t2 = await timeAsync(async () => await tfClipOutliersAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
