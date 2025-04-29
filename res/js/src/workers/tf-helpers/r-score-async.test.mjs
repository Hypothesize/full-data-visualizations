import {
  apply,
  DataFrame,
  normal,
  range,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { rScore as oldRScore } from "@jrc03c/js-data-science-helpers"
import { tfRScoreAsync } from "./r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("gets the r-score of various arrays", async () => {
  const a = normal(100)
  expect(await tfRScoreAsync(a, a)).toBe(1)

  const b = normal([2, 3, 4, 5, 6])
  const c = apply(b, v => v + 1e-5 * normal())
  expect(await tfRScoreAsync(b, c)).toBeGreaterThan(0.99)

  const d = new Series({ hello: normal(100) })
  const e = new Series({ goodbye: normal(100) })

  expect(await tfRScoreAsync(d, e)).toBe(
    await tfRScoreAsync(d.values, e.values),
  )

  const f = new DataFrame(normal([100, 5]))
  const g = new DataFrame(normal([100, 5]))

  expect(await tfRScoreAsync(f, g)).toBe(
    await tfRScoreAsync(f.values, g.values),
  )

  const h = normal(1000)
  const i = normal(1000)

  expect(Math.abs((await tfRScoreAsync(h, i)) - oldRScore(h, i))).toBeLessThan(
    1e-5,
  )

  const j = normal([100, 10])
  const k = normal([100, 10])

  range(0, 100).forEach(() => {
    const m = parseInt(Math.random() * j.length)
    const n = parseInt(Math.random() * j[m].length)
    j[m][n] = "oh no!"

    const o = parseInt(Math.random() * k.length)
    const p = parseInt(Math.random() * k[o].length)
    k[o][p] = "oh no too!"
  })

  expect(await tfRScoreAsync(j, k)).not.toBeNaN()

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
        await tfRScoreAsync(v1, v2)
      } catch (e) {
        failed = true
      }

      expect(failed).toBe(true)
    }
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfRScoreAsync` is faster than `oldRScore` (from @jrc03c/js-data-science-helpers)", async () => {
  const a = normal([100, 100])
  const b = normal([100, 100])
  const t1 = await timeAsync(async () => oldRScore(a, b))
  const t2 = await timeAsync(async () => await tfRScoreAsync(a, b))
  expect(t1).toBeGreaterThan(t2)
})
