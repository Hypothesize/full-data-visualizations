import {
  abs,
  correl,
  isNumber,
  normal,
  range,
  transpose,
} from "@jrc03c/js-math-tools"

import { tfRScoreAsync } from "./r-score-async.mjs"
import { tfSVDAsync } from "./svd-async.mjs"
import * as tf from "@tensorflow/tfjs"
import fs from "node:fs"
import path from "node:path"

test("tests that tfSVDAsync works correctly", async () => {
  const data = JSON.parse(
    fs.readFileSync(
      path.join(import.meta.dirname, "svd-async-results-from-numpy.json"),
      "utf8",
    ),
  )

  const x = data.x
  const uTrue = data.u
  const sTrue = tf.util.flatten(data.s).filter(v => v > 0)
  const vTrue = transpose(data.vt)

  const results = await tfSVDAsync(x)
  const uPred = results.u
  const sPred = tf.util.flatten(results.s).filter(v => v > 0)
  const vPred = results.v

  expect(await tfRScoreAsync(abs(uTrue), abs(uPred))).toBeGreaterThan(0.99)
  expect(correl(sTrue, sPred)).toBeGreaterThan(0.99)
  expect(await tfRScoreAsync(abs(vTrue), abs(vPred))).toBeGreaterThan(0.99)

  const m = normal([100, 10])

  range(0, 100).forEach(() => {
    const i = parseInt(Math.random() * m.length)
    const j = parseInt(Math.random() * m[i].length)
    m[i][j] = "oh no!"
  })

  const n = await tfSVDAsync(m)

  n.u.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(false)
    })
  })

  n.s.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(false)
    })
  })

  n.v.forEach(row => {
    row.forEach(v => {
      expect(isNumber(v)).toBe(false)
    })
  })

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
