import {
  DataFrame,
  isArray,
  isDataFrame,
  isEqual,
  isSeries,
  normal,
  Series,
} from "@jrc03c/js-math-tools"

import { tfRScoreAsync } from "./r-score-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that DataFrames and Series can be unpacked correctly", async () => {
  const a = unpack(() => {})
  expect(typeof a).toBe("function")

  const b = new DataFrame(normal([100, 10]))
  const c = new Series(normal(1000))

  const stack = unpack((a, b) => {
    return [a, b]
  })

  expect(isEqual(stack(b, c), [b.values, c.values])).toBe(true)

  const eTrue = normal([2, 3, 4, 5, 6])
  const ePred = unpack(x => x)(tf.tensor(eTrue))
  expect(ePred instanceof tf.Tensor).toBe(false)
  expect(isArray(ePred)).toBe(true)
  expect(await tfRScoreAsync(eTrue, ePred)).toBeGreaterThan(0.99)

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
    [
      [2, 3, 4],
      [5, 6, 7],
    ],
    { hello: "world" },
    new Series({ hello: [10, 20, 30, 40, 50] }),
    new DataFrame({ foo: [1, 2, 4, 8, 16], bar: [1, 3, 9, 27, 81] }),
  ]

  wrongs.forEach(wrong => {
    expect(() => unpack(wrong)).toThrow()
  })

  const identity = unpack(x => x)

  wrongs
    .filter(v => !isDataFrame(v) && !isSeries(v))
    .forEach(other => {
      expect(isEqual(identity(other), other)).toBe(true)
    })
})
