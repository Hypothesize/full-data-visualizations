import { DataFrame } from "@jrc03c/js-math-tools"
import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import { tfGetPValueMatrixAsync } from "./tf-helpers/get-p-value-matrix-async.mjs"
import * as Bee from "@jrc03c/bee"

async function getPValues(x, progress) {
  return await tfGetPValueMatrixAsync(x, progress)
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-p-values", async (request, response) => {
    const numbersOnlyCoreData = resurrect(request.data)

    const pValues = new DataFrame(
      await getPValues(numbersOnlyCoreData, p => {
        drone.emit("get-p-values-progress", {
          progress: p,
          type: "info",
          message: `Computing p-values... (${(100 * p).toFixed(2)}%)`,
        })
      }),
    )

    pValues.columns = numbersOnlyCoreData.columns
    pValues.index = numbersOnlyCoreData.columns
    return response.send(pValues)
  })
}

export { getPValues }
