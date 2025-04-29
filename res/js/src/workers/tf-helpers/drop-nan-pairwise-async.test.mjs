import {
  DataFrame,
  isArray,
  isEqual,
  normal,
  random,
  range,
  Series,
  shape,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { dropNaNPairwise as oldDropNaNPairwise } from "@jrc03c/js-math-tools"
import { tfDropNaNPairwiseAsync } from "./drop-nan-pairwise-async.mjs"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that NaN values can be correctly dropped pairwise", async () => {
  const a = [2, 3, 4]
  const b = [5, 6, 7]
  expect(isEqual(await tfDropNaNPairwiseAsync(a, b), [a, b])).toBe(true)

  const c = [2, 3, "foo", null, 6]
  const d = [true, 8, 9, 10, 11]

  expect(
    isEqual(await tfDropNaNPairwiseAsync(c, d), [
      [3, 6],
      [8, 11],
    ]),
  ).toBe(true)

  const e = new Series(normal(100))
  e.values[parseInt(random() * e.values.length)] = "foo"
  const f = new Series(normal(100))
  f.values[parseInt(random() * f.values.length)] = "bar"
  const gTrue = await tfDropNaNPairwiseAsync(e.copy().values, f.copy().values)
  const gPred = await tfDropNaNPairwiseAsync(e.copy(), f.copy())
  expect(await tfRScoreAsync(gTrue, gPred)).toBeGreaterThan(0.99)

  const h = normal(1000)
  const i = normal(1000)

  range(0, 100).forEach(() => {
    h[parseInt(Math.random() * h.length)] = null
  })

  range(0, 100).forEach(() => {
    i[parseInt(Math.random() * i.length)] = null
  })

  const [jTrue, kTrue] = oldDropNaNPairwise(h, i)
  const [jPred, kPred] = await tfDropNaNPairwiseAsync(h, i)
  expect(await tfRScoreAsync(jTrue, jPred)).toBeGreaterThan(0.99)
  expect(await tfRScoreAsync(kTrue, kPred)).toBeGreaterThan(0.99)

  const l = normal(100)
  const m = normal(1000)
  let failed = false

  try {
    await tfDropNaNPairwiseAsync(l, m)
  } catch (e) {
    failed = true
  }

  expect(failed).toBe(true)

  const wrongs = [
    [0, 1],
    [2.3, -2.3],
    [Infinity, -Infinity],
    [NaN, "foo"],
    [true, false],
    [null, undefined],
    [Symbol.for("Hello, world!"), [2, 3, 4]],
    [
      [
        [2, 3, 4],
        [5, 6, 7],
      ],
      x => x,
    ],
    [
      function (x) {
        return x
      },
      { hello: "world" },
    ],
    [normal([2, 3, 4, 5]), normal([5, 4, 3, 2])],
    new DataFrame(normal([100, 10])),
  ]

  for (let i = 0; i < wrongs.length; i++) {
    for (let h = 0; h < wrongs.length; h++) {
      const v1 = wrongs[i]
      const v2 = wrongs[h]

      if (
        !isArray(v1) ||
        shape(v1).length !== 1 ||
        !isArray(v2) ||
        shape(v2).length !== 1
      ) {
        let failed = false

        try {
          await tfDropNaNPairwiseAsync(v1, v2)
        } catch (e) {
          failed = true
        }

        expect(failed).toBe(true)
      }
    }
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfDropNaNPairwiseAsync` is faster than `oldDropNaNPairwise` (from @jrc03c/js-math-tools)", async () => {
  const a = random(10000).map(v => (random() < 0.01 ? null : v))
  const b = random(10000).map(v => (random() < 0.01 ? null : v))
  const t1 = await timeAsync(async () => oldDropNaNPairwise(a, b))
  const t2 = await timeAsync(async () => await tfDropNaNPairwiseAsync(a, b))
  expect(t1).toBeGreaterThan(t2)
})
