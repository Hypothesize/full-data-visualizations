import {
  assert,
  isArray,
  isFunction,
  isNumber,
  isUndefined,
  shape,
} from "@jrc03c/js-math-tools"

import { mapAsync } from "../../utils/index.mjs"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { tfInvertAsync } from "./invert-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfGetCorrelationMatrixAsync = unpack(async (x, progress) => {
  const tensors = []
  const totalSteps = 8
  let step = 0

  try {
    assert(
      isArray(x),
      "The value passed into the `tftfGetCorrelationMatrixAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional tf.tensor!",
    )

    assert(
      isUndefined(progress) || isFunction(progress),
      "The second value passed into the `tfGetCorrelationMatrixAsync` function, if used, must be a function!",
    )

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const xt = tf.tidy(() =>
      tf.tensor2d(x, shape(x), "float32").transpose().arraySync(),
    )

    x = tf.transpose(
      await mapAsync(xt, async col => {
        const clean = await tfDropNaNAsync(col)
        const mean = tf.tidy(() => tf.mean(clean).arraySync())
        return col.map(v => (isNumber(v) ? v - mean : 0))
      }),
    )

    tensors.push(x)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const n = x.shape[0]
    const axis = 0
    const z = tf.tidy(() => x.sub(x.mean(axis)))
    tensors.push(z)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const c = tf.tidy(() => {
      return z
        .transpose()
        .dot(z)
        .divNoNan(n - 1)
    })

    tensors.push(c)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const d = tf.tidy(() => {
      return tf.diag(tf.sqrt(c.arraySync().map((row, i) => row[i])))
    })

    tensors.push(d)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const dinv = tf.tensor(await tfInvertAsync(d))
    tensors.push(dinv)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const almost = tf.tidy(() => dinv.dot(c).dot(dinv))
    tensors.push(almost)

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    const out = tf.tidy(() => {
      return almost
        .add(almost.transpose())
        .div(2)
        .clipByValue(-1, 1)
        .arraySync()
    })

    if (progress) {
      step += 1
      progress(step / totalSteps)
    }

    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    return out
  } catch (e) {
    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    throw e
  }
})

export { tfGetCorrelationMatrixAsync }
