import { assert, isEqual, shape } from "@jrc03c/js-math-tools"
import { hash } from "@jrc03c/js-crypto-helpers"
import { resurrect, unproxify, urlPathJoin } from "../utils/index.mjs"
import * as Bee from "@jrc03c/bee"
import localForage from "localforage"

const DEFAULT_SETTINGS = {
  truncationMode: "end",
}

class Store {
  static CORE_DATA_HASH_KEY = "/data/core-data-hash"
  static CORE_DATA_KEY = "/data/core-data"
  static CORE_DATA_TYPES_KEY = "/data/core-data-types"
  static K_MEANS_RESULTS_KEY = "/data/k-means-results"
  static NUMBERS_ONLY_CORE_DATA_KEY = "/data/numbers-only-core-data"
  static P_VALUES_KEY = "/data/p-values"
  static PARTIAL_CORRELATIONS_KEY = "/data/partial-correlations"
  static PCA_LOADINGS_KEY = "/data/pca-loadings"
  static REGULAR_CORRELATIONS_KEY = "/data/regular-correlations"
  static SETTINGS_KEY = "/settings"
  static VARIABLE_DISTRIBUTIONS_KEY = "/data/variable-distributions"

  baseURL = "/"
  imageDir = "res/img"
  isComputingCoreDataTypes = false
  isComputingKMeansResults = false
  isComputingNumbersOnlyCoreData = false
  isComputingPartialCorrelations = false
  isComputingPCALoadings = false
  isComputingPValues = false
  isComputingRegularCorrelations = false
  isComputingVariableDistributions = false
  globalQueen = null
  settings = DEFAULT_SETTINGS
  workerBundleDir = "dist/worker-bundles"

  constructor(options) {
    options = options || {}

    localForage.config({
      driver: options.localForageDriver || localForage.INDEXEDDB,
    })
  }

  async get(key) {
    let out = await localForage.getItem(key)

    try {
      out = resurrect(out)
    } catch (e) { }

    return out
  }

  async getCoreData() {
    const temp = await this.get(Store.CORE_DATA_KEY)

    if (temp) {
      return resurrect(temp)
    }
  }

  async getCoreDataTypes(coreData, customHash) {
    if (this.isComputingCoreDataTypes) {
      return
    }

    this.isComputingCoreDataTypes = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(this.baseURL, this.workerBundleDir, "get-data-types.js"),
      )

      const coreDataTypes = await this.globalQueen.command("get-data-types", {
        data: coreData,
        shouldInferPerCell: true,
      })

      if (!coreDataTypes) {
        wasCancelled = true
        return
      }

      await this.setCoreDataTypes(coreDataTypes)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    let temp = await this.get(Store.CORE_DATA_TYPES_KEY)

    if (temp) {
      this.isComputingCoreDataTypes = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingCoreDataTypes = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.CORE_DATA_TYPES_KEY))
      }
    }
  }

  async getCorrelationsAndPValues(coreData, progress) {
    try {
      if (coreData) {
        coreData = unproxify(coreData)
      } else {
        coreData = await this.getCoreData()
      }

      if (!coreData) {
        return
      }

      // regular correlations
      const regularCorrelationsTemp = await this.getRegularCorrelations(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress / 3,
              message: `Computing regular correlations... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
      )

      if (!regularCorrelationsTemp) {
        return
      }

      const regularCorrelations = resurrect(regularCorrelationsTemp)

      // partial correlations
      const partialCorrelationsTemp = await this.getPartialCorrelations(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress / 3 + 1 / 3,
              message: `Computing partial correlations... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
      )

      if (!partialCorrelationsTemp) {
        return
      }

      const partialCorrelations = resurrect(partialCorrelationsTemp)

      // p-values
      const pValuesTemp = await this.getPValues(coreData, p => {
        if (progress) {
          progress({
            progress: p.progress / 3 + 2 / 3,
            message: `Computing p-values... (${(100 * p.progress).toFixed(2)}%)`,
          })
        }
      })

      if (!pValuesTemp) {
        return
      }

      const pValues = resurrect(pValuesTemp)

      return {
        partialCorrelations,
        pValues,
        regularCorrelations,
      }
    }
    catch (err) {
      return err
    }
  }

  async getKMeansResults(coreData, settings, progress, customHash) {
    if (this.isComputingKMeansResults) {
      return
    }

    this.isComputingKMeansResults = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    if (settings) {
      settings = unproxify(settings)
    }

    let wasCancelled = false

    const recompute = async () => {
      const numbersOnlyCoreData = await this.getNumbersOnlyCoreData(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress * 0.1,
              type: p.type,
              message: `Computing numbers-only core data... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
        customHash
      )

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(
          this.baseURL,
          this.workerBundleDir,
          "get-k-means-results.js",
        ),
      )

      const unsub = this.globalQueen.on(
        "get-k-means-results-progress",
        (request, response) => {
          if (progress) {
            progress({
              progress: request.data.progress * 0.9 + 0.1,
              type: request.data.type,
              message: `Computing K-means results... (${(100 * request.data.progress).toFixed(2)}%)`,
            })
          }

          return response.send()
        },
      )

      const kMeansResults = await this.globalQueen.command(
        "get-k-means-results",
        {
          data: numbersOnlyCoreData,
          settings,
        },
      )

      unsub()

      if (!kMeansResults) {
        wasCancelled = true
        return
      }

      await this.setKMeansResults(kMeansResults)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.K_MEANS_RESULTS_KEY)

    if (temp) {
      Object.keys(temp).forEach(key => {
        try {
          temp[key] = resurrect(temp[key])
        } catch (e) { }
      })

      this.isComputingKMeansResults = false
      return temp
    } else if (!wasCancelled) {
      await recompute()
      const out = await this.get(Store.K_MEANS_RESULTS_KEY)

      if (out && !wasCancelled) {
        Object.keys(out).forEach(key => {
          try {
            out[key] = resurrect(out[key])
          } catch (e) { }
        })

        this.isComputingKMeansResults = false
        return out
      }
    }
  }

  async getNumbersOnlyCoreData(coreData, progress, customHash) {
    if (this.isComputingNumbersOnlyCoreData) {
      return
    }

    this.isComputingNumbersOnlyCoreData = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(
          this.baseURL,
          this.workerBundleDir,
          "get-numbers-only-data.js",
        ),
      )

      const unsub = this.globalQueen.on(
        "get-numbers-only-data-progress",
        (request, response) => {
          if (progress) {
            progress(request.data)
          }

          return response.send()
        },
      )

      const numbersOnlyCoreData = await this.globalQueen.command(
        "get-numbers-only-data",
        coreData,
      )

      unsub()

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.set(Store.NUMBERS_ONLY_CORE_DATA_KEY, numbersOnlyCoreData)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.NUMBERS_ONLY_CORE_DATA_KEY)

    if (temp) {
      this.isComputingNumbersOnlyCoreData = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingNumbersOnlyCoreData = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.NUMBERS_ONLY_CORE_DATA_KEY))
      }
    }
  }

  async getPartialCorrelations(coreData, progress, customHash) {
    if (this.isComputingPartialCorrelations) {
      return
    }

    this.isComputingPartialCorrelations = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      const numbersOnlyCoreData = await this.getNumbersOnlyCoreData(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress / 3,
              message: `Computing numbers-only core data... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
      )

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(
          this.baseURL,
          this.workerBundleDir,
          "get-partial-correlations.js",
        ),
      )

      const unsub = this.globalQueen.on(
        "get-partial-correlations-progress",
        (request, response) => {
          if (progress) {
            progress({
              progress: (request.data.progress * 2) / 3 + 1 / 3,
              message: `Computing partial correlations... (${(100 * request.data.progress).toFixed(2)}%)`,
            })
          }

          return response.send()
        },
      )

      const partialCorrelations = await this.globalQueen.command(
        "get-partial-correlations",
        numbersOnlyCoreData,
      )

      unsub()

      if (!partialCorrelations) {
        wasCancelled = true
        return
      }

      await this.setPartialCorrelations(partialCorrelations)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.PARTIAL_CORRELATIONS_KEY)

    if (typeof temp === "string") {
      return temp
    }
    else if (temp) {
      this.isComputingPartialCorrelations = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingPartialCorrelations = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.PARTIAL_CORRELATIONS_KEY))
      }
    }
  }

  async getPCALoadings(coreData, progress, customHash) {
    if (this.isComputingPCALoadings) {
      return
    }

    this.isComputingPCALoadings = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      const numbersOnlyCoreData = await this.getNumbersOnlyCoreData(
        coreData,
        progress,
        customHash
      )

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(this.baseURL, this.workerBundleDir, "get-pca-loadings.js"),
      )

      const pcaLoadings = await this.globalQueen.command(
        "get-pca-loadings",
        numbersOnlyCoreData,
      )

      if (!pcaLoadings) {
        wasCancelled = true
        return
      }

      await this.setPCALoadings(pcaLoadings)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.PCA_LOADINGS_KEY)

    if (temp) {
      this.isComputingPCALoadings = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingPCALoadings = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.PCA_LOADINGS_KEY))
      }
    }
  }

  async getPValues(coreData, progress, customHash) {
    if (this.isComputingPValues) {
      return
    }

    this.isComputingPValues = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      const numbersOnlyCoreData = await this.getNumbersOnlyCoreData(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress / 3,
              type: p.type,
              message: `Computing numbers-only core data... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
        customHash
      )

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(this.baseURL, this.workerBundleDir, "get-p-values.js"),
      )

      const unsub = this.globalQueen.on(
        "get-p-values-progress",
        (request, response) => {
          if (progress) {
            progress({
              progress: (request.data.progress * 2) / 3 + 1 / 3,
              message: `Computing p-values... (${(100 * request.data.progress).toFixed(2)}%)`,
            })
          }

          return response.send()
        },
      )

      const pValues = await this.globalQueen.command(
        "get-p-values",
        numbersOnlyCoreData,
      )

      unsub()

      if (!pValues) {
        wasCancelled = true
        return
      }

      await this.setPValues(pValues)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.P_VALUES_KEY)

    if (temp) {
      this.isComputingPValues = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingPValues = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.P_VALUES_KEY))
      }
    }
  }

  async getRegularCorrelations(coreData, progress, customHash) {
    if (this.isComputingRegularCorrelations) {
      return
    }

    this.isComputingRegularCorrelations = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      const numbersOnlyCoreData = await this.getNumbersOnlyCoreData(
        coreData,
        p => {
          if (progress) {
            progress({
              progress: p.progress / 3,
              message: `Computing numbers-only core data... (${(100 * p.progress).toFixed(2)}%)`,
            })
          }
        },
      )

      if (!numbersOnlyCoreData) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(
          this.baseURL,
          this.workerBundleDir,
          "get-regular-correlations.js",
        ),
      )

      const unsub = this.globalQueen.on(
        "get-regular-correlations-progress",
        (request, response) => {
          if (progress) {
            const percent = (request.data.progress * 2) / 3 + 1 / 3

            progress({
              progress: percent,
              message: `Computing regular correlations... (${(100 * percent).toFixed(2)}%)`,
            })
          }

          return response.send()
        },
      )

      const regularCorrelations = await this.globalQueen.command(
        "get-regular-correlations",
        numbersOnlyCoreData,
      )

      unsub()

      if (!regularCorrelations) {
        wasCancelled = true
        return
      }

      await this.setRegularCorrelations(regularCorrelations)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.REGULAR_CORRELATIONS_KEY)

    if (temp) {
      this.isComputingRegularCorrelations = false
      return resurrect(temp)
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingRegularCorrelations = false

      if (!wasCancelled) {
        return resurrect(await this.get(Store.REGULAR_CORRELATIONS_KEY))
      }
    }
  }

  async getSettings() {
    return (await this.get(Store.SETTINGS_KEY)) || this.settings
  }

  async getVariableDistributions(coreData, progress, customHash) {
    if (this.isComputingVariableDistributions) {
      return
    }

    this.isComputingVariableDistributions = true

    if (coreData) {
      coreData = unproxify(coreData)
    } else {
      coreData = await this.getCoreData()
    }

    if (!coreData) {
      return
    }

    let wasCancelled = false

    const recompute = async () => {
      const coreDataTypes = await this.getCoreDataTypes(coreData)

      if (!coreDataTypes) {
        wasCancelled = true
        return
      }

      await this.resetQueen()

      this.globalQueen.addDrone(
        urlPathJoin(
          this.baseURL,
          this.workerBundleDir,
          "get-variable-distributions.js",
        ),
      )

      const unsub = this.globalQueen.on(
        "get-variable-distributions-progress",
        (request, response) => {
          if (progress) {
            progress(request.data)
          }

          return response.send()
        },
      )

      const variableDistributions = await this.globalQueen.command(
        "get-variable-distributions",
        {
          data: coreData,
          dataTypes: coreDataTypes,
          config: {
            topNToCount: 7,
          },
        },
      )

      unsub()

      if (!variableDistributions) {
        wasCancelled = true
        return
      }

      await this.setVariableDistributions(variableDistributions)
    }

    if (await this.shouldRecompute(coreData, customHash)) {
      await recompute()
    }

    const temp = await this.get(Store.VARIABLE_DISTRIBUTIONS_KEY)

    if (temp) {
      this.isComputingVariableDistributions = false
      return temp
    } else if (!wasCancelled) {
      await recompute()
      this.isComputingVariableDistributions = false

      if (!wasCancelled) {
        return await this.get(Store.VARIABLE_DISTRIBUTIONS_KEY)
      }
    }
  }

  async loadSettings() {
    const cachedSettings = await this.get(Store.SETTINGS_KEY)

    if (cachedSettings) {
      this.settings = cachedSettings
    }
  }

  async removeAllData() {
    await localForage.clear()
  }

  async resetQueen() {
    if (this.globalQueen) {
      try {
        this.globalQueen.destroy()
      } catch (e) { }
    }

    this.globalQueen = new Bee.Queen()
    this.isComputingCoreDataTypes = false
    this.isComputingKMeansResults = false
    this.isComputingNumbersOnlyCoreData = false
    this.isComputingPartialCorrelations = false
    this.isComputingPCALoadings = false
    this.isComputingPValues = false
    this.isComputingRegularCorrelations = false
    this.isComputingVariableDistributions = false
  }

  async set(key, value) {
    await localForage.setItem(key, value)
  }

  async setCoreData(coreData, customHash) {
    coreData = unproxify(coreData)

    const oldHash = await this.get(Store.CORE_DATA_HASH_KEY)
    const newHash = customHash ?? await hash(coreData)
    const shouldRecompute = newHash !== oldHash

    if (shouldRecompute) {
      const keysToReset = [
        Store.CORE_DATA_KEY,
        Store.CORE_DATA_HASH_KEY,
        Store.CORE_DATA_TYPES_KEY,
        Store.K_MEANS_RESULTS_KEY,
        Store.NUMBERS_ONLY_CORE_DATA_KEY,
        Store.PARTIAL_CORRELATIONS_KEY,
        Store.PCA_LOADINGS_KEY,
        Store.P_VALUES_KEY,
        Store.REGULAR_CORRELATIONS_KEY,
        Store.VARIABLE_DISTRIBUTIONS_KEY,
      ]

      for (const key of keysToReset) {
        await localForage.removeItem(key)
      }

      await this.set(Store.CORE_DATA_KEY, coreData)
      await this.set(Store.CORE_DATA_HASH_KEY, customHash ?? await hash(coreData))
    }

    return shouldRecompute
  }

  async setCoreDataTypes(coreDataTypes) {
    coreDataTypes = unproxify(coreDataTypes)
    const coreData = await this.getCoreData()

    assert(
      isEqual(shape(coreDataTypes.values), shape(coreData.values)),
      `The DataFrame containing the data types of the core dataset must have the same shape as the core dataset DataFrame! (The core dataset has a shape of [${shape(coreData.values).join(", ")}], but the DataFrame containing data types you provided has a shape of [${shape(coreDataTypes.values).join(", ")}].)`,
    )

    if (!isEqual(coreDataTypes.columns, coreData.columns)) {
      console.log("coreDataTypes.columns:", coreDataTypes.columns)
      console.log("coreData.columns:", coreData.columns)

      assert(
        isEqual(coreDataTypes.columns, coreData.columns),
        `The DataFrame containing the data types of the core dataset must have the same column names as the core dataset DataFrame! Please examine the two arrays printed above (i.e., the column names of the data types DataFrame and the column names of the core dataset DataFrame, respectively) for discrepancies.`,
      )
    }

    if (!isEqual(coreDataTypes.index, coreData.index)) {
      console.log("coreDataTypes.index:", coreDataTypes.index)
      console.log("coreData.index:", coreData.index)

      assert(
        isEqual(coreDataTypes.index, coreData.index),
        `The DataFrame containing the data types of the core dataset must have the same row names as the core dataset DataFrame! Please examine the two arrays printed above (i.e., the row names of the data types DataFrame and the row names of the core dataset DataFrame, respectively) for discrepancies.`,
      )
    }

    await this.set(Store.CORE_DATA_TYPES_KEY, coreDataTypes)
  }

  async setKMeansResults(kMeansResults) {
    await this.set(Store.K_MEANS_RESULTS_KEY, kMeansResults)
  }

  async setPartialCorrelations(partialCorrelations) {
    partialCorrelations = unproxify(partialCorrelations)
    await this.set(Store.PARTIAL_CORRELATIONS_KEY, partialCorrelations)
  }

  async setRegularCorrelations(regularCorrelations) {
    regularCorrelations = unproxify(regularCorrelations)
    await this.set(Store.REGULAR_CORRELATIONS_KEY, regularCorrelations)
  }

  async setPCALoadings(pcaLoadings) {
    pcaLoadings = unproxify(pcaLoadings)
    await this.set(Store.PCA_LOADINGS_KEY, pcaLoadings)
  }

  async setPValues(pValues) {
    pValues = unproxify(pValues)
    await this.set(Store.P_VALUES_KEY, pValues)
  }

  async setSettings(settings) {
    await this.set(Store.SETTINGS_KEY, settings)
    this.settings = settings
  }

  async setVariableDistributions(variableDistributions) {
    await this.set(Store.VARIABLE_DISTRIBUTIONS_KEY, variableDistributions)
  }

  async shouldRecompute(coreData, customHash) {
    try {
      return await this.setCoreData(coreData, customHash)
    } catch (e) {
      console.error(e)
      return true
    }
  }
}

const store = new Store()
export { store, Store }
