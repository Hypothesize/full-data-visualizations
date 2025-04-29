import {
  DataFrame,
  isEqual,
  normal,
  Series,
  set,
  sign,
  sort,
} from "@jrc03c/js-math-tools"

import { mapAsync } from "./map-async.mjs"
import { pause } from "@jrc03c/pause"
import { tfRScoreAsync } from "../workers/tf-helpers/r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that the `mapAsync` function works as expected", async () => {
  // serial
  const a = normal(100)
  const aWait = 10
  const bTrue = a.map(v => v * 2)
  const mustRunInOrder = true
  const start1 = new Date()

  const bPred = await mapAsync(
    a,
    async v => {
      v *= 2
      await pause(aWait)
      return v
    },
    mustRunInOrder,
  )

  expect(isEqual(bTrue, bPred)).toBe(true)
  expect(new Date() - start1).toBeGreaterThan(a.length * aWait)

  // parallel
  const c = sort(set(normal(100)))
  const cWait = 10
  const dTrue = sort(set(c.map(v => v * v * sign(v))))
  const start2 = new Date()

  const dPred = sort(
    set(
      await mapAsync(c, async v => {
        v = v * v * sign(v)
        await pause(cWait)
        return v
      }),
    ),
  )

  expect(await tfRScoreAsync(dTrue, dPred)).toBeGreaterThan(0.99)
  expect(new Date() - start2).toBeLessThan(c.length * cWait)

  // other relevant data types
  await (async () => {
    let failed = false

    try {
      await mapAsync(new Series(normal(100)), async v => v)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(false)
  })()

  await (async () => {
    let failed = false

    try {
      await mapAsync(new DataFrame(normal([25, 25])), async v => v)
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(false)
  })()

  await (async () => {
    let failed = false
    const x = tf.tensor(normal([2, 3, 4, 5]))

    try {
      await mapAsync(x, async v => v)
    } catch (e) {
      failed = true
    }

    x.dispose()
    expect(failed).toBe(false)
  })()

  // errors
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
    { hello: "world" },
  ]

  for (let i = 0; i < wrongs.length; i++) {
    for (let j = 0; j < wrongs.length; j++) {
      const v1 = wrongs[i]
      const v2 = wrongs[j]

      let failed = false

      try {
        await mapAsync(v1, v2)
      } catch (e) {
        failed = true
      }

      expect(failed).toBe(true)
    }
  }

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
