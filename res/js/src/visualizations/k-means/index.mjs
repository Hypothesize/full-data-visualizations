// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import {
  DataFrame,
  distance,
  isNumber,
  max,
  min,
  range,
  remap,
} from "@jrc03c/js-math-tools"

import { Cluster } from "./cluster.mjs"
import { CollapsibleComponent } from "../../components/collapsible.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { css } from "./css.mjs"

import {
  debounce,
  getCSSVariableValue,
  leftPad,
  parseCSSColorList,
  truncate,
  urlPathJoin,
} from "../../utils/index.mjs"

import { ModalWithPromptComponent } from "../../components/modal-with-prompt.mjs"
import { NotificationComponent } from "../../components/notification.mjs"
import { pause } from "@jrc03c/pause"
import { ProgressComponent } from "../../components/progress.mjs"
import { saveCSV } from "@jrc03c/js-csv-helpers/browser"
import { SpinnerComponent } from "../../components/spinner.mjs"
import { store } from "../../store/index.mjs"
import { template } from "./template.mjs"

async function KMeansVisualization(options) {
  options = options || {}

  if (options.data) {
    await store.setCoreData(options.data, options.customHash)
  }

  if (options.dataTypes) {
    await store.setCoreDataTypes(options.dataTypes)
  }

  const component = createVueComponentWithCSS({
    name: "hvis-k-means-vis",

    components: {
      "hvis-collapsible-component": await CollapsibleComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-modal-with-prompt": await ModalWithPromptComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-notification": await NotificationComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-spinner": await SpinnerComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      const backgroundColorCSSVariable = getCSSVariableValue(
        "--vis-k-means-color-background",
      )

      const clusterColorsCSSVariable = parseCSSColorList(
        getCSSVariableValue("--vis-k-means-colors-cluster") || "",
      )

      return {
        centroidsTransformed: null,
        clusters: [],
        colors: {
          background:
            options.colors && options.colors.background
              ? options.colors.background
              : backgroundColorCSSVariable || "black",
          clusters:
            options.colors && options.colors.clusters
              ? options.colors.clusters
              : clusterColorsCSSVariable.length > 0
                ? clusterColorsCSSVariable
                : [
                    "red",
                    "orange",
                    "yellow",
                    "green",
                    "blue",
                    "purple",
                    "brown",
                    "pink",
                    "white",
                    "gray",
                  ],
        },
        coreData: null,
        css,
        firstTimeSelectedCentroidData: null,
        firstTimeSettingSelectedCentroidData: true,
        isRunning: false,
        labels: null,
        maxClusters: 15,
        minClusters: 1,
        newTitle: "",
        numbersOnlyCoreData: null,
        progress: 0,
        renameModalIsVisible: false,
        selectedCentroidData: null,
        settings: {
          ks: range(1, 15),
          maxIterations: 25,
          maxRestarts: 5,
        },
        status: "Computing K-means results...",
        error: null,
        store,
        tableIsVisible: false,
        tsneCentroids: null,
        tsneData: null,
      }
    },

    computed: {
      downloadImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "download.svg")
      },

      editImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "edit.svg")
      },

      redoImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "redo.svg")
      },
    },

    watch: {
      async selectedCentroidData() {
        await pause(0)
        this.firstTimeSettingSelectedCentroidData = false
        this.tableIsVisible = !!this.selectedCentroidData
      },
    },

    methods: {
      cancelRename() {
        this.renameModalIsVisible = false
      },

      closeTable() {
        this.selectedCentroidData = null

        setTimeout(() => {
          this.redraw()
        }, 100)
      },

      async confirmRename() {
        const newTitle = this.newTitle.trim()

        if (newTitle.length === 0) {
          return
        }

        this.renameModalIsVisible = false

        const cluster = this.clusters.find(
          cluster => cluster.title === this.selectedCentroidData.title,
        )

        const oldTitle = cluster.title
        cluster.title = newTitle
        this.selectedCentroidData.title = newTitle

        const results = await store.getKMeansResults()

        if (!results) {
          return
        }

        results.centroidsLearned.index[
          results.centroidsLearned.index.indexOf(oldTitle)
        ] = newTitle

        results.centroidsTSNEProjected.index[
          results.centroidsTSNEProjected.index.indexOf(oldTitle)
        ] = newTitle

        results.centroidsTransformed.index[
          results.centroidsTransformed.index.indexOf(oldTitle)
        ] = newTitle

        await store.setKMeansResults(results)
      },

      async downloadSelectedCentroidData() {
        const title = this.selectedCentroidData.title.split(" ").join("-")
        const centroid = this.selectedCentroidData.centroid
        const points = this.selectedCentroidData.points
        const pointsIndices = this.selectedCentroidData.pointsIndices
        const n = this.numbersOnlyCoreData.values.length.toString().length

        const rowNames = pointsIndices.map(i => {
          return "row" + i.toString().padStart(n, "0")
        })

        let out = new DataFrame([centroid, ...points])
        out.columns = this.numbersOnlyCoreData.columns
        out = out.assign("(index)", ["cluster center", ...rowNames])

        out = out.get(["(index)"].concat(this.numbersOnlyCoreData.columns))

        saveCSV(`${title}.csv`, out)
      },

      leftPad,

      range,

      async redraw() {
        this.stop()
        await pause(100)
        this.shouldStop = false

        if (!this.tsneData) {
          return
        }

        if (!this.$refs.container) {
          return
        }

        if (this.selectedCentroidData) {
          setTimeout(() => {
            this.clusters[this.selectedCentroidData.index].isSelected = true
          }, 150)
        }

        const data = this.tsneData.values
        const x = data.map(p => p[0])
        const y = data.map(p => p[1])
        const xmin = min(x)
        const xmax = max(x)
        const xrange = xmax - xmin
        const ymin = min(y)
        const ymax = max(y)
        const yrange = ymax - ymin
        const container = this.$refs.container
        const width = container.getBoundingClientRect().width
        const height = width
        const padding = 0.2

        const canvas = createHighDPICanvas(width, height)
        container.innerHTML = ""
        container.appendChild(canvas)

        const context = canvas.getContext("2d")
        context.fillStyle = this.colors.background
        context.fillRect(0, 0, width, height)

        await pause(100)

        const clusters = this.tsneCentroids.values.map((centroid, i) => {
          const pointsIndices = []

          const points = this.tsneData.values
            .filter((point, j) => {
              if (this.labels[j] === i) {
                pointsIndices.push(j)
                return true
              }

              return false
            })
            .map(point => {
              return [
                remap(
                  point[0],
                  xmin - padding * xrange,
                  xmax + padding * xrange,
                  0,
                  width,
                ),
                remap(
                  point[1],
                  ymin - padding * yrange,
                  ymax + padding * yrange,
                  0,
                  height,
                ),
              ]
            })

          if (pointsIndices.length === 0) {
            return console.warn(
              `Hm. It seems that Cluster ${i} was not assigned any points. Something must've gone wrong...`,
            )
          }

          return new Cluster({
            index: i,
            title: this.centroidsTransformed.index[i],
            centroidOrig: centroid,

            centroid: [
              remap(
                centroid[0],
                xmin - padding * xrange,
                xmax + padding * xrange,
                0,
                width,
              ),
              remap(
                centroid[1],
                ymin - padding * yrange,
                ymax + padding * yrange,
                0,
                height,
              ),
            ],

            color: this.colors.clusters[i % this.colors.clusters.length],
            points,
            pointsIndices,
          })
        })

        this.clusters = clusters

        const mouse = { x: 0, y: 0, isClicked: false }
        let clusterUnderMouse = null

        const loop = () => {
          if (this.shouldStop) {
            return
          } else {
            window.requestAnimationFrame(loop)
          }

          document.body.style.cursor = "default"

          context.fillStyle = this.colors.background
          context.fillRect(0, 0, width, height)

          for (let i = 0; i < this.clusters.length; i++) {
            const cluster = this.clusters[i]

            if (cluster.centroidIsUnderMouse) {
              this.clusters.splice(i, 1)
              this.clusters.push(cluster)
              break
            }
          }

          this.clusters.forEach(cluster => {
            cluster.display(context, mouse)
          })
        }

        canvas.addEventListener("mousemove", event => {
          mouse.x = event.offsetX
          mouse.y = event.offsetY

          let closestClusterToMouse = this.clusters[0]
          let closestDistance = Infinity

          this.clusters.forEach(cluster => {
            cluster.centroidIsUnderMouse = false

            const d = distance(cluster.centroid, [mouse.x, mouse.y])

            if (d < closestDistance) {
              closestDistance = d
              closestClusterToMouse = cluster
            }
          })

          closestClusterToMouse.centroidIsUnderMouse = true
        })

        canvas.addEventListener("mousedown", () => {
          mouse.isClicked = true

          this.clusters.forEach(cluster => {
            if (cluster.centroidIsUnderMouse) {
              clusterUnderMouse = cluster
            }
          })
        })

        canvas.addEventListener("mouseup", async () => {
          mouse.isClicked = false
          this.selectedCentroidData = null

          this.clusters.forEach(cluster => {
            cluster.isSelected = false

            if (cluster.centroidIsUnderMouse && cluster === clusterUnderMouse) {
              cluster.isSelected = true

              const temp = {
                index: cluster.index,
                title: cluster.title,

                centroid: this.centroidsTransformed.values[cluster.index].map(
                  v => (isNumber(v) ? v.toFixed(2) : null),
                ),

                color: cluster.color,

                points: this.numbersOnlyCoreData
                  .get(cluster.pointsIndices, null)
                  .values.map(point =>
                    point.map(v => (isNumber(v) ? v.toFixed(2) : null)),
                  ),

                pointsIndices: cluster.pointsIndices,
              }

              this.selectedCentroidData = temp

              setTimeout(() => {
                this.$el
                  .querySelector("table")
                  .scrollIntoView({ behavior: "smooth" })
              }, 100)
            }
          })

          clusterUnderMouse = null
        })

        canvas.addEventListener("mouseleave", () => {
          this.clusters.forEach(
            cluster => (cluster.centroidIsUnderMouse = false),
          )
        })

        loop()
      },

      async rerunKMeans() {
        await this.reset()
        this.startKMeans()
      },

      async reset() {
        await store.setKMeansResults(null)
        this.selectedCentroidData = null
      },

      async startKMeans() {
        if (this.isRunning) {
          return
        }

        this.minClusters = parseInt(this.minClusters)
        this.maxClusters = parseInt(this.maxClusters)

        if (this.minClusters > this.maxClusters) {
          return
        }

        this.isRunning = true
        this.progress = 0

        await pause(10)

        this.settings.ks = range(this.minClusters, this.maxClusters + 1)

        const results = await store.getKMeansResults(
          null,
          this.settings,
          progress => {
            this.progress = progress.progress * 100
            this.status = progress.message
          },
          options.customHash
        )

        if (!results) {
          return
        }
        else if (typeof results === "string") {
          this.status = results
          this.progress = 100
          this.error = results

          return
        }

        this.progress = 100

        const coreData = await store.getCoreData()

        if (!coreData) {
          return
        }

        const numbersOnlyCoreData = await store.getNumbersOnlyCoreData()

        if (!numbersOnlyCoreData) {
          return
        }

        this.coreData = coreData
        this.numbersOnlyCoreData = numbersOnlyCoreData

        await pause(500)

        this.centroidsTransformed = results.centroidsTransformed
        this.tsneData = results.dataTSNEProjected
        this.tsneCentroids = results.centroidsTSNEProjected
        this.labels = results.labels

        await pause(100)

        this.redraw()
        this.isRunning = false
      },

      startRename() {
        this.renameModalIsVisible = true
        this.newTitle = this.selectedCentroidData.title

        setTimeout(() => {
          this.$refs.renameInput.focus()
          this.$refs.renameInput.select()
        }, 100)
      },

      stop() {
        this.shouldStop = true
      },

      truncate,
    },

    async mounted() {
      this.redraw = debounce(this.redraw, 100, this)
      await this.startKMeans()
    },

    beforeUnmount() {
      this.stop()
    },
  })

  if (options.shouldReturnComponentOnly) {
    return component
  }

  const app = createApp({
    components: {
      "hvis-k-means-vis": component,
    },

    template: `
			<hvis-k-means-vis></hvis-k-means-vis>
		`,
  })

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { KMeansVisualization }
