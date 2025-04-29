import {
  abs,
  DataFrame,
  dropNaN,
  normal,
  random,
  range,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { stdev as oldStdev } from "@jrc03c/js-math-tools"
import { tfStdevAsync } from "./stdev-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that standard deviations can be correctly computed", async () => {
  const a = normal(10000)
  expect(abs((await tfStdevAsync(a)) - 1)).toBeLessThan(0.02)

  const b = random(10000)
  expect(abs((await tfStdevAsync(b)) - 0.28)).toBeLessThan(0.02)

  const c = new Series({ hello: normal(100) })

  expect(
    abs((await tfStdevAsync(c)) - (await tfStdevAsync(c.values))),
  ).toBeLessThan(0.02)

  const d = new DataFrame({ foo: normal(100), bar: normal(100) })

  expect(
    abs((await tfStdevAsync(d)) - (await tfStdevAsync(d.values))),
  ).toBeLessThan(0.02)

  const e = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * e.length)
    const j = parseInt(Math.random() * e[i].length)
    e[i][j] = "oh no!"
  })

  expect(await tfStdevAsync(e)).not.toBeNaN()

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
      await tfStdevAsync(value)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfStdevAsync` is faster than `oldStdev` (from @jrc03c/js-math-tools)", async () => {
  const x = normal(10000)

  const t1 = await timeAsync(async () => {
    return oldStdev(dropNaN(x))
  })

  const t2 = await timeAsync(async () => await tfStdevAsync(x))
  expect(t1).toBeGreaterThan(t2)
})
