import { DataFrame, isDataFrame, range } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import { tfClipOutliersAsync } from "./tf-helpers/clip-outliers-async.mjs"
import { KMeansMeta, TSNE } from "@jrc03c/tf-k-means"
import * as Bee from "@jrc03c/bee"
import * as tf from "@tensorflow/tfjs"

async function getKMeansResults(numbersOnlyData, settings, progress) {
  tf.engine().startScope()

  if (!isDataFrame(numbersOnlyData)) {
    numbersOnlyData = resurrect(numbersOnlyData)
  }

  if (progress) {
    progress(0)
  }

  // drop nan values
  numbersOnlyData = numbersOnlyData.dropNaN()

  // clip outliers in the data
  let x = {}

  for (const col of numbersOnlyData.columns) {
    x[col] = await tfClipOutliersAsync(numbersOnlyData.get(col))
  }

  x = new DataFrame(x)
  x.index = numbersOnlyData.index.slice()
  x.columns = numbersOnlyData.columns.slice()

  // fit the k-means model
  const kmeans = new KMeansMeta(
    settings || {
      finalMaxIterations: 100,
      finalMaxRestarts: 50,
      finalMaxTime: 1000,
      initialization: KMeansMeta.Initialization.PLUS_PLUS,
      ks: range(2, 15),
      maxIterations: 50,
      maxRestarts: 25,
      maxTime: 3000,
      method: KMeansMeta.Method.SILHOUETTE,
      shouldNormalizeInputData: true,
      testSize: 0.25,
      tolerance: 1e-4,
    },
  )

  kmeans.fit(x.values, p => {
    if (progress) {
      progress(p * 0.75)
    }
  })

  // predict labels
  const labels = kmeans.predict(x.values).arraySync()

  // compile learned centroids
  const centroidsLearned = new DataFrame(kmeans.centroids.arraySync())
  centroidsLearned.columns = numbersOnlyData.columns.slice()

  centroidsLearned.index = range(0, kmeans.centroids.shape[0]).map(
    i => "Cluster" + i,
  )

  // compile transformed (back into x's space) centroids
  const centroidsTransformed = new DataFrame(
    kmeans.fittedModel.scaler.untransform(kmeans.centroids).arraySync(),
  )

  centroidsTransformed.columns = centroidsLearned.columns.slice()
  centroidsTransformed.index = centroidsLearned.index.slice()

  // project data and centroids
  const allPoints = x.values.concat(centroidsTransformed.values)

  const tsne = new TSNE({
    dimensions: 2,
    learningRate: 100,
    maxIterations: 1000,
    maxTime: 3000, // it really needs more time than this, though!
    perplexity: 30,
  })

  const allPointsProjected = tsne
    .fitTransform(allPoints, p => {
      if (progress) {
        progress(0.75 + p * 0.25)
      }
    })
    .arraySync()

  const dataTSNEProjected = new DataFrame(
    allPointsProjected.slice(0, x.shape[0]),
  )

  dataTSNEProjected.columns = ["x", "y"]
  dataTSNEProjected.index = numbersOnlyData.index.slice()

  const centroidsTSNEProjected = new DataFrame(
    allPointsProjected.slice(x.shape[0]),
  )

  centroidsTSNEProjected.columns = ["x", "y"]
  centroidsTSNEProjected.index = centroidsLearned.index.slice()

  if (progress) {
    progress(1)
  }

  kmeans.dispose()
  tf.engine().endScope()

  return {
    centroidsLearned,
    centroidsTransformed,
    centroidsTSNEProjected,
    dataTSNEProjected,
    labels,
  }
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-k-means-results", async (request, response) => {
    return response.send(
      await getKMeansResults(
        request.data.data,
        request.data.settings,
        progress => {
          drone.emit("get-k-means-results-progress", {
            progress,
            type: "info",
            message: `Getting K-means results... (${(100 * progress).toFixed(2)}%)`,
          })
        },
      ),
    )
  })
}

export { getKMeansResults }
