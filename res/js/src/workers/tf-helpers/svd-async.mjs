import {
  apply,
  assert,
  isArray,
  ndarray,
  shape,
  zeros,
} from "@jrc03c/js-math-tools"

import { SVD } from "ml-matrix"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfSVDAsync = unpack(async x => {
  assert(
    isArray(x),
    "The value passed into the `tfSVDAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  const xShape = shape(x)

  assert(
    xShape.length === 2,
    "The value passed into the `tfSVDAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  // NOTE: I'm not making any attempt to handle NaN values in this function
  // because (1) I'm relying on a third-party library (ml-matrix) to do the
  // actual computation, and (2) it's not clear to me what could be done with
  // the NaN values anyway. If anyone has any good ideas, though, please let me
  // know!

  const xFlat = tf.util.flatten(x)
  const xFlatClean = await tfDropNaNAsync(xFlat)

  if (xFlatClean.length < xFlat.length) {
    return {
      u: apply(ndarray([xShape[0], xShape[0]]), () => NaN),
      s: apply(ndarray([xShape[0], xShape[1]]), () => NaN),
      v: apply(ndarray([xShape[1], xShape[1]]), () => NaN),
    }
  }

  if (xShape[0] > xShape[1]) {
    x = x.map(row => row.concat(zeros(xShape[0] - xShape[1])))
  } else if (xShape[0] < xShape[1]) {
    x = x.concat(zeros([xShape[1] - xShape[0], xShape[1]]))
  }

  const svd = new SVD(x)
  const u = svd.U.to2DArray()

  const s = svd.diagonalMatrix
    .to2DArray()
    .slice(0, xShape[0])
    .map(row => row.slice(0, xShape[1]))

  const v = svd.V.to2DArray()
    .slice(0, xShape[1])
    .map(row => row.slice(0, xShape[1]))

  return { u, s, v }
})

export { tfSVDAsync }
