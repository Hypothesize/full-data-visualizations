import {
  assert,
  isArray,
  isNumber,
  isUndefined,
  reshape,
  shape,
} from "@jrc03c/js-math-tools"

import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfRemapAsync = unpack(async (x, a, b, c, d) => {
  if (isNumber(x)) {
    return ((d - c) * (x - a)) / (b - a) + c
  }

  assert(
    isArray(x),
    "The first value passed into the `tfRemapAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
  )

  const xShape = shape(x)
  const xFlat = tf.util.flatten(x)
  const xClean = []
  const nans = []

  xFlat.forEach((v, i) => {
    if (!isNumber(v)) {
      nans.push({ value: v, index: i })
      xFlat[i] = 0
    } else {
      xClean.push(v)
    }
  })

  if (isUndefined(c) && isUndefined(d)) {
    c = a
    d = b
    a = tf.tidy(() => tf.min(xClean).arraySync())
    b = tf.tidy(() => tf.max(xClean).arraySync())
  }

  const constants = [a, b, c, d]

  constants.forEach(v => {
    assert(
      isNumber(v),
      "The second, third, fourth, and fifth values passed into the `tfRemapAsync` function must be numbers!",
    )
  })

  return tf.tidy(() => {
    const out = tf
      .tensor(xFlat)
      .sub(a)
      .div(b - a)
      .mul(d - c)
      .add(c)
      .arraySync()

    nans.forEach(v => {
      out[v.index] = v.value
    })

    return reshape(out, xShape)
  })
})

export { tfRemapAsync }
