import { DataFrame, isDataFrame } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import * as Bee from "@jrc03c/bee"

import { tfGetPartialCorrelationMatrixAsync } from "./tf-helpers/get-partial-correlation-matrix-async.mjs"

async function getPartialCorrelations(numbersOnlyData, progress) {
  if (!isDataFrame(numbersOnlyData)) {
    numbersOnlyData = resurrect(numbersOnlyData)
  }

  const values = await tfGetPartialCorrelationMatrixAsync(
    numbersOnlyData,
    progress,
  )

  const out = new DataFrame(values)
  out.columns = numbersOnlyData.columns
  out.index = numbersOnlyData.columns
  return out
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-partial-correlations", async (request, response) => {
    return response.send(
      await getPartialCorrelations(resurrect(request.data), p => {
        drone.emit("get-partial-correlations-progress", {
          progress: p,
          type: "info",
          message: `Computing partial correlations... (${(100 * p).toFixed(2)}%)`,
        })
      }),
    )
  })
}

export { getPartialCorrelations }
