import { assert, shape } from "@jrc03c/js-math-tools"
import { tfGetCorrelationMatrixAsync } from "./get-correlation-matrix-async.mjs"
import { tfInvertAsync } from "./invert-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfGetPartialCorrelationMatrixAsync = unpack(async (x, progress) => {
  assert(
    shape(x).length === 2,
    "The first value passed into the `tfGetPartialCorrelationMatrixAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  let out

  tf.engine().startScope()

  const c = await tfGetCorrelationMatrixAsync(x)
  const p = await tfInvertAsync(c)
  out = tf.zeros(shape(c)).arraySync()

  for (let i = 0; i < p.length - 1; i++) {
    for (let j = i + 1; j < p.length; j++) {
      const r = -p[i][j] / Math.sqrt(p[i][i] * p[j][j])
      out[i][j] = r
      out[j][i] = r
    }

    out[i][i] = 1

    if (progress) {
      progress(i / (p.length - 1))
    }
  }

  out[out.length - 1][out.length - 1] = 1

  tf.engine().endScope()

  if (progress) {
    progress(1)
  }

  return out
})

export { tfGetPartialCorrelationMatrixAsync }
