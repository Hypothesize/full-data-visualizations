import { DataFrame, isDataFrame } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import { tfGetCorrelationMatrixAsync } from "./tf-helpers/get-correlation-matrix-async.mjs"
import * as Bee from "@jrc03c/bee"

async function getRegularCorrelations(numbersOnlyData, progress) {
  if (!isDataFrame(numbersOnlyData)) {
    numbersOnlyData = resurrect(numbersOnlyData)
  }

  const values = await tfGetCorrelationMatrixAsync(numbersOnlyData, progress)
  const out = new DataFrame(values)
  out.columns = numbersOnlyData.columns
  out.index = numbersOnlyData.columns
  return out
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-regular-correlations", async (request, response) => {
    return response.send(
      await getRegularCorrelations(resurrect(request.data), p => {
        drone.emit("get-regular-correlations-progress", {
          progress: p,
          type: "info",
          message: `Computing regular correlations... (${(100 * p).toFixed(2)}%)`,
        })
      }),
    )
  })
}

export { getRegularCorrelations }
