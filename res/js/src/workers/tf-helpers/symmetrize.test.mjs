import { DataFrame, isEqual, normal } from "@jrc03c/js-math-tools"
import { symmetrize } from "./symmetrize.mjs"
import * as tf from "@tensorflow/tfjs"

function isSymmetrical(x) {
  if (x instanceof DataFrame) {
    return isSymmetrical(x.values) && isEqual(x.index, x.columns)
  }

  if (x instanceof tf.Tensor) {
    return isSymmetrical(x.arraySync())
  }

  for (let i = 0; i < x.length; i++) {
    for (let j = 0; j < x[i].length; j++) {
      if (x[i][j] !== x[j][i]) {
        return false
      }
    }
  }

  return true
}

test("tests that `symmetrize` works correctly", () => {
  const a = normal([100, 100])
  expect(isSymmetrical(symmetrize(a))).toBe(true)

  const b = new DataFrame(normal([100, 100]))
  b.index = b.columns.slice()
  expect(isSymmetrical(symmetrize(b))).toBe(true)
  expect(b instanceof DataFrame).toBe(true)

  tf.tidy(() => {
    const c = tf.tensor(normal([100, 100]))
    const d = symmetrize(c)
    expect(isSymmetrical(d)).toBe(true)
    expect(d instanceof tf.Tensor).toBe(true)
  })

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
