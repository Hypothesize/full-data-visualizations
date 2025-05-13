import { DataFrame, isDataFrame, range, sum } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import { tfPcaAsync } from "./tf-helpers/pca-async.mjs"
import * as Bee from "@jrc03c/bee"

async function getPCALoadings(numbersOnlyData) {
  if (!isDataFrame(numbersOnlyData)) {
    numbersOnlyData = resurrect(numbersOnlyData)
  }

  const results = await tfPcaAsync(numbersOnlyData.copy())
  const eigenvalues = results.eigenvalues
  let loadings = results.loadings

  let eigenvaluesThatMatter = eigenvalues.filter((v, i) => {
    return v > 2 && v / sum(eigenvalues.slice(0, i)) > 0.05
  })

  if (eigenvaluesThatMatter.length === 0) {
    eigenvaluesThatMatter.push(eigenvalues[0])
  }

  if (eigenvaluesThatMatter.length > 5) {
    eigenvaluesThatMatter = eigenvaluesThatMatter.slice(0, 5)
  }

  loadings = loadings.map(row => row.slice(0, eigenvaluesThatMatter.length))
  loadings = new DataFrame(loadings)

  loadings.columns = range(0, loadings.columns.length).map(
    i => "Factor " + (i + 1),
  )

  loadings.index = numbersOnlyData.columns
  return loadings
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-pca-loadings", async (request, response) => {
    return response.send(await getPCALoadings(request.data))
  })
}

export { getPCALoadings }
