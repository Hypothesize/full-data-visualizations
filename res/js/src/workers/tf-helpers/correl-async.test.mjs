import {
  add,
  DataFrame,
  dropNaNPairwise,
  normal,
  random,
  range,
  scale,
  Series,
  timeAsync,
} from "@jrc03c/js-math-tools"

import { correl as oldCorrel } from "@jrc03c/js-math-tools"
import { engine, memory } from "@tensorflow/tfjs"
import { tfCorrelAsync } from "./correl-async.mjs"

test("tests that correlations can be computed correctly", async () => {
  const a = normal(1000)
  const b = add(a, scale(0.0001, normal(1000)))
  expect(await tfCorrelAsync(a, a)).toBeCloseTo(1)
  expect(await tfCorrelAsync(a, b)).toBeGreaterThan(0.99)

  expect(
    await tfCorrelAsync(
      a,
      range(0, 1000).map(() => NaN),
    ),
  ).toBeNaN()

  const c = add(a, scale(0.1, normal(1000)))
  expect(await tfCorrelAsync(a, c)).toBeGreaterThan(0.75)

  const d = normal(1000)
  expect(await tfCorrelAsync(a, d)).toBeGreaterThan(-0.25)
  expect(await tfCorrelAsync(a, d)).toBeLessThan(0.25)

  const e = new Series(a)
  const f = new Series(b)
  expect(await tfCorrelAsync(e, f)).toBeGreaterThan(0.99)
  expect(await tfCorrelAsync([2, 3, 4], ["five", "six", "seven"])).toBeNaN()

  const g = normal(1000)
  const h = normal(1000)

  range(0, 100).forEach(() => {
    g[parseInt(Math.random() * g.length)] = "oh no!"
    h[parseInt(Math.random() * h.length)] = "oh no too!"
  })

  expect(await tfCorrelAsync(g, h)).not.toBeNaN()

  const wrongs = [
    [0, 1],
    [Infinity, NaN],
    ["foo", true],
    [false, null],
    [undefined, Symbol.for("Hello, world!")],
    [
      x => x,
      function (x) {
        return x
      },
    ],
    [{ hello: "world" }, { goodbye: "world" }],
    [normal(100), normal(200)],
    [new Series(normal(100)), new Series(normal(101))],
    [new DataFrame(normal([100, 2])), new DataFrame(normal([100, 2]))],
  ]

  for (let i = 0; i < wrongs.length; i++) {
    const pair = wrongs[i]
    let failed = false

    try {
      await tfCorrelAsync(pair[0], pair[1])
    } catch (e) {
      failed = true
    }

    expect(failed).toBe(true)
  }

  expect(memory().numTensors).toBe(0)
  expect(Object.keys(engine().state.registeredVariables).length).toBe(0)
})

test("tests that `tfCorrelAsync` is faster than `oldCorrel` (from @jrc03c/js-math-tools)", async () => {
  const a = normal(10000).map(v => (random() < 0.01 ? null : v))
  const b = normal(10000).map(v => (random() < 0.01 ? null : v))

  const t1 = await timeAsync(async () => {
    const [atemp, btemp] = dropNaNPairwise(a, b)
    return oldCorrel(atemp, btemp)
  })

  const t2 = await timeAsync(async () => await tfCorrelAsync(a, b))
  expect(t1).toBeGreaterThan(t2)
})
