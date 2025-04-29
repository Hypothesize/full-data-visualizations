import { assert, isArray, shape } from "@jrc03c/js-math-tools"
import { mapAsync } from "../../utils/index.mjs"
import { tfClipOutliersAsync } from "./clip-outliers-async.mjs"
import { tfGetCorrelationMatrixAsync } from "./get-correlation-matrix-async.mjs"
import { tfNormalizeAsync } from "./normalize-async.mjs"
import { tfSVDAsync } from "./svd-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfPcaAsync = unpack(async x => {
  const tensors = []

  try {
    assert(
      isArray(x) && shape(x).length === 2,
      "The value passed into the `tfPcaAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
    )

    const xNormalized = tf.transpose(
      await mapAsync(
        tf.tidy(() =>
          tf.tensor2d(x, shape(x), "float32").transpose().arraySync(),
        ),
        async row => tfNormalizeAsync(await tfClipOutliersAsync(row)),
      ),
    )

    tensors.push(xNormalized)

    const c = await tfGetCorrelationMatrixAsync(xNormalized)
    const { u, s } = await tfSVDAsync(c)

    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    return {
      loadings: u,

      eigenvalues: tf.tidy(() =>
        tf
          .tensor(tf.util.flatten(s).filter(v => v > 0))
          .pow(2)
          .arraySync(),
      ),
    }
  } catch (e) {
    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    throw e
  }
})

export { tfPcaAsync }
