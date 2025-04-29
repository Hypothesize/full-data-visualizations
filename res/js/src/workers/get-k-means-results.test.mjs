import {
  add,
  argmin,
  DataFrame,
  distance,
  normal,
  range,
  scale,
  shape,
} from "@jrc03c/js-math-tools"

import { getKMeansResults } from "./get-kmeans-results.mjs"
import { tfRScoreAsync } from "./tf-helpers/r-score-async.mjs"
import * as tf from "@tensorflow/tfjs"

test("tests that k-means results can be computed correctly", async () => {
  const centroids = normal([5, 10])

  const x = new DataFrame(
    range(0, 100).map(() => {
      const c = centroids[parseInt(Math.random() * centroids.length)]
      return add(c, scale(0.1, normal(shape(c))))
    }),
  )

  const { centroidsTransformed } = await getKMeansResults(x)
  const sortedcentroidsTransformed = []

  centroidsTransformed.values.forEach(c1 => {
    const index = argmin(centroids.map(c2 => distance(c1, c2)))
    sortedcentroidsTransformed[index] = c1
  })

  expect(
    await tfRScoreAsync(centroids, sortedcentroidsTransformed),
  ).toBeGreaterThan(0.95)

  expect(tf.memory().numTensors).toBe(0)
  expect(Object.keys(tf.engine().state.registeredVariables).length).toBe(0)
})
