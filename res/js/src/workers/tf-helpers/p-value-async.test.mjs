import { DataFrame, normal, range, Series } from "@jrc03c/js-math-tools"
import { pValue as oldPValue } from "@jrc03c/js-data-science-helpers"
import { tfPValueAsync } from "./p-value-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that p-values can be correctly computed", async () => {
  const a = normal(100)
  expect(await tfPValueAsync(a, a)).toBe(1)

  const b = normal(100)
  const c = normal(100).map(v => v + 100)
  expect(await tfPValueAsync(b, c)).toBeLessThan(0.0001)

  const f = new Series({ hello: normal(100) })
  const g = new Series({ goodbye: normal(100) })
  const hTrue = oldPValue(f, g)
  const hPred = await tfPValueAsync(f, g)
  expect(hPred).toBeCloseTo(hTrue)

  const i = normal(1000)
  const j = normal(1000)

  range(0, 100).forEach(() => {
    i[parseInt(Math.random() * i.length)] = "oh no!"
    j[parseInt(Math.random() * j.length)] = "oh no too!"
  })

  const shouldIgnoreNaNs = true
  const kTrue = oldPValue(i, j, shouldIgnoreNaNs)
  const kPred = await tfPValueAsync(i, j)
  expect(kPred).toBeCloseTo(kTrue)

  expect(
    await tfPValueAsync(
      i,
      range(0, 1000).map(() => NaN),
    ),
  ).toBeNaN()

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
    normal([2, 3, 4, 5]),
    Symbol.for("Hello, world!"),
    x => x,
    function (x) {
      return x
    },
    { hello: "world" },
    new DataFrame(normal([100, 10])),
  ]

  for (let i = 0; i < wrongs.length; i++) {
    for (let j = 0; j < wrongs.length; j++) {
      const v1 = wrongs[i]
      const v2 = wrongs[j]
      let failed = false

      try {
        await tfPValueAsync(v1, v2)
      } catch (e) {
        failed = true
      }

      expect(failed).toBe(true)
    }
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

// =============================================================================
// NOTE: The test below has been disabled because it turns out that the
// @jrc03c/js-data-science-helpers `pValue` function is faster than the
// TensorFlow version!
// =============================================================================

// test("tests that `tfPValueAsync` is faster than `oldPValue` (from @jrc03c/js-data-science-helpers)", async () => {
// 	const a = normal(10000)
// 	const b = normal(10000)
// 	const t1 = await timeAsync(async () => oldPValue(a, b))
// 	const t2 = await timeAsync(async () => await tfPValueAsync(a, b))
// 	expect(t1).toBeGreaterThan(t2)
// })
