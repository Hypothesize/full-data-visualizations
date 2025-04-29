import {
  DataFrame,
  int,
  isNumber,
  normal,
  random,
  reshape,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { dropNaN as oldDropNaN } from "@jrc03c/js-math-tools"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that NaN values can be dropped correctly", async () => {
  const a = normal(100)
  expect(await tfRScoreAsync(a, await tfDropNaNAsync(a))).toBeGreaterThan(0.99)

  const b = []
  const cTrue = []

  for (let i = 0; i < 100; i++) {
    const v = normal()

    if (random() < 0.1) {
      b.push("foo")
    } else {
      b.push(v)
      cTrue.push(v)
    }
  }

  const cPred = await tfDropNaNAsync(b)
  expect(await tfRScoreAsync(cTrue, cPred)).toBeGreaterThan(0.99)

  const d = [
    [2, 3, 4],
    [5, 6, true, 8],
    [9, false, 11, x => 2 * x, { hello: "world" }],
  ]

  const eTrue = [2, 3, 4, 5, 6, 8, 9, 11]
  const ePred = await tfDropNaNAsync(d)
  expect(await tfRScoreAsync(eTrue, ePred)).toBeGreaterThan(0.99)

  const f = new Series(normal(100).map(v => (random() < 0.5 ? "null" : v)))
  const gTrue = new Series(f.values.filter(v => isNumber(v)))
  const gPred = await tfDropNaNAsync(f)
  gTrue._index = gPred._index
  expect(await tfRScoreAsync(gTrue, gPred)).toBeGreaterThan(0.99)

  const g = new DataFrame(
    normal([10, 10]).map(row => row.map(v => (random() < 0.05 ? false : v))),
  )

  const hTrue = tf.util.flatten(g.values).filter(v => isNumber(v))
  const hPred = await tfDropNaNAsync(g)
  hTrue._index = hPred._index
  expect(await tfRScoreAsync(hTrue, hPred)).toBeGreaterThan(0.99)

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
      await tfDropNaNAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  let i = normal(2 * 3 * 4 * 5 * 6)

  for (let j = 0; j < i.length; j++) {
    const value = wrongs[int(random() * wrongs.length)]
    i[int(random() * i.length)] = value
  }

  i = reshape(i, [2, 3, 4, 5, 6])

  const jTrue = tf.util.flatten(oldDropNaN(i))
  const jPred = await tfDropNaNAsync(i)

  jTrue.forEach((vtrue, i) => {
    const vpred = jPred[i]

    if (vtrue === Infinity || vtrue === -Infinity) {
      expect(vpred).toBe(vtrue)
    } else {
      expect(Math.abs(vtrue - vpred)).toBeLessThan(1e-5)
    }
  })

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfDropNaNAsync` is faster than `oldDropNaN` (from @jrc03c/js-math-tools)", async () => {
  const x = random(10000).map(v => (random() < 0.01 ? null : v))
  const t1 = await timeAsync(async () => oldDropNaN(x))
  const t2 = await timeAsync(async () => await tfDropNaNAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
