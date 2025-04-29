import { isDataFrame } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import { tfConvertToNumericalAsync } from "./tf-helpers/convert-to-numerical.mjs"
import * as Bee from "@jrc03c/bee"

async function getNumbersOnlyData(data, progress) {
  if (!isDataFrame(data)) {
    data = resurrect(data)
  }

  const out = await tfConvertToNumericalAsync(data, {
    progress: p => {
      if (progress) {
        progress(p)
      }
    },
  })

  if (progress) {
    progress(1)
  }

  return out
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-numbers-only-data", async (request, response) => {
    return response.send(
      await getNumbersOnlyData(request.data, progress => {
        drone.emit("get-numbers-only-data-progress", {
          progress,
          type: "info",
          message: `Getting numbers-only data... (${(100 * progress).toFixed(2)}%)`,
        })
      }),
    )
  })
}

export { getNumbersOnlyData }
