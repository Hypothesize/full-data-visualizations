// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-correlations-grid-vis {
		max-width: 100%;
		overflow: hidden;
		position: relative;
	}

	.hvis-correlations-grid-vis .hvis-mode-options-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-start;
		align-content: center;
		align-items: center;
		gap: 0;
		margin-bottom: var(--padding);
	}

	.hvis-correlations-grid-vis .hvis-mode-options-container button {
		border-radius: 0;
	}

	.hvis-correlations-grid-vis .hvis-mode-options-container button:first-child {
		border-radius: var(--border-radius) 0 0 var(--border-radius);
	}

	.hvis-correlations-grid-vis .hvis-mode-options-container button:last-child {
		border-radius: 0 var(--border-radius) var(--border-radius) 0;
	}

	.hvis-correlations-grid-vis .hvis-canvas-container {
		max-width: 100%;
		max-height: calc(100vh - 15em);
		overflow: auto;
		border-radius: 4px;
    background-color: var(--color-gray-13);
	}

	.hvis-correlations-grid-vis canvas {
		max-width: unset !important;
	}

	.hvis-correlations-grid-vis .hvis-correlations-legend-container {
		position: absolute;
		top: 100px;
		right: 24px;
		z-index: 999;
	}

	.hvis-correlations-grid-vis .hvis-buttons-row {
		gap: calc(var(--line-thickness) * 2);
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div
		@mousedown="onMouseDown"
		@mousemove="onMouseMove"
		class="hvis-correlations-grid-vis"
		ref="root">
    	<div v-if="typeof error === 'string'" class="hvis-card is-warning" style="margin-bottom: 2rem">
				<div class="hvis-card-content">
					<div class="hvis-content" style="display: flex; flex-direction: column; gap: 1rem"> 
						<p style="margin: auto">A correlation visualization could not be generated for this dataset</p>
					</div>
				</div>
			</div>
		<div v-else-if="isComputing">
			<hvis-progress
				:message="progress.message"
				:percent="progress.percent">
			</hvis-progress>
		</div>

		<div v-else>
			<div class="hvis-mode-options-container">
				<button
					:class="{ 'is-primary': option === chosenModeOption }"
					:key="option.name"
					@click="chosenModeOption = option"
					class="hvis-mode-option"
					v-for="option in modeOptions">
					{{ option.name }}
				</button>
			</div>

			<div class="hvis-correlations-legend-container">
				<hvis-correlations-legend
					:color-negative="colors.negative"
					:color-positive="colors.positive"
					:points="points"
					@hovered-over-value="highlightRValue"
					v-if="canDownload">
				</hvis-correlations-legend>
			</div>

			<div ref="container" class="hvis-canvas-container"></div>

			<br />

			<div class="hvis-row-left hvis-buttons-row" v-if="canDownload">
				<button @click="downloadMatrix">
					Download matrix
				</button>

				<button @click="downloadImage">
					Download image
				</button>
			</div>

			<hvis-floating-label
				:content="topFloatingLabel.content"
				:v-align="topFloatingLabel.vAlign"
				:x="topFloatingLabel.x"
				:y="topFloatingLabel.y"
				v-if="topFloatingLabel.isVisible">
			</hvis-floating-label>

			<hvis-floating-label
				:content="bottomFloatingLabel.content"
				:v-align="bottomFloatingLabel.vAlign"
				:x="bottomFloatingLabel.x"
				:y="bottomFloatingLabel.y"
				v-if="bottomFloatingLabel.isVisible">
			</hvis-floating-label>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { abs, argmax, clamp, int, min, set, sort } from "@jrc03c/js-math-tools"
import { CorrelationsLegendComponent } from "../legend.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"

import {
  debounce,
  getCSSVariableValue,
  truncate,
  Vector2,
} from "../../../utils/index.mjs"

import { FloatingLabelComponent } from "./floating-label.mjs"
import { Label } from "./label.mjs"
import { pause } from "@jrc03c/pause"
import { ProgressComponent } from "../../../components/progress.mjs"
import { saveCSV } from "@jrc03c/js-csv-helpers/browser"
import { store } from "../../../store/index.mjs"

const CSS_VARIABLE_NEGATIVE_COLOR = "--vis-corr-grid-color-negative"
const CSS_VARIABLE_POSITIVE_COLOR = "--vis-corr-grid-color-positive"

async function CorrelationsGridVisualization(options) {
  options = options || {}

  if (options.data) {
    await store.setCoreData(options.data, options.customHash)
  }

  if (options.dataTypes) {
    await store.setCoreDataTypes(options.dataTypes)
  }

  const component = createVueComponentWithCSS({
    name: "hvis-correlations-grid-vis",

    components: {
      "hvis-correlations-legend": await CorrelationsLegendComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-floating-label": FloatingLabelComponent,
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      return {
        bottomFloatingLabel: {
          content: "",
          isVisible: false,
          vAlign: "top",
          x: 0,
          y: 0,
        },
        canDownload: false,
        chosenModeOption: null,
        colors: {
          negative:
            options.colors && options.colors.negative
              ? options.colors.negative
              : getCSSVariableValue(CSS_VARIABLE_NEGATIVE_COLOR) || "orange",
          positive:
            options.colors && options.colors.positive
              ? options.colors.positive
              : getCSSVariableValue(CSS_VARIABLE_POSITIVE_COLOR) ||
              "dodgerblue",
        },
        css,
        highlightedRValue: null,
        isComputing: false,
        modeOptions: [
          {
            name: "Pairwise Correlations",
            value: "regularPairwiseCorrelationMode",
          },
          { name: "Partial Correlations", value: "partialCorrelationMode" },
        ],
        mouse: {
          buttonIsDown: false,
          x: 0,
          y: 0,
        },
        partialCorrelations: null,
        points: [],
        progress: {
          message: "Computing...",
          percent: 0,
        },
        error: null,
        pValues: null,
        regularCorrelations: null,
        shouldStop: false,
        topFloatingLabel: {
          content: "",
          isVisible: false,
          vAlign: "bottom",
          x: 0,
          y: 0,
        },
      }
    },

    watch: {
      chosenModeOption() {
        this.redraw()
      },
    },

    methods: {
      async downloadMatrix() {
        if (this.chosenModeOption.value === "regularPairwiseCorrelationMode") {
          await saveCSV("regular-correlations.csv", this.regularCorrelations, {
            index: true,
          })
        } else {
          await saveCSV("partial-correlations.csv", this.partialCorrelations, {
            index: true,
          })
        }
      },

      async downloadImage() {
        const canvas = this.$refs.container.querySelector("high-dpi-canvas")
        const a = document.createElement("a")
        a.href = canvas.toDataURL()
        a.download = "correlation-grid.png"
        a.dispatchEvent(new MouseEvent("click"))
      },

      highlightRValue(r) {
        this.highlightedRValue = r
      },

      onMouseDown(event) {
        this.mouse.buttonIsDown = true
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
        document.body.style.cursor = "grabbing"
      },

      onMouseMove(event) {
        if (this.mouse.buttonIsDown) {
          const dx = event.clientX - this.mouse.x
          const dy = event.clientY - this.mouse.y
          this.mouse.x = event.clientX
          this.mouse.y = event.clientY
          this.$refs.container.scrollBy(-dx, -dy)
        }
      },

      onMouseUp() {
        this.mouse.buttonIsDown = false
        document.body.style.cursor = ""
      },

      async redraw() {
        this.stop()
        await pause(10)
        this.shouldStop = false

        await pause(10)

        this.isComputing = true

        const results = await store.getCorrelationsAndPValues(null, p => {
          this.progress.percent = p.progress * 100
          this.progress.message = p.message
        })

        if (results instanceof Error) {
          this.error = results.message
        }
        else if (!results) {
          return
        }

        this.regularCorrelations = results.regularCorrelations
        this.partialCorrelations = results.partialCorrelations
        const pValues = results.pValues

        this.isComputing = false

        const correlations =
          this.chosenModeOption.value === "regularPairwiseCorrelationMode"
            ? this.regularCorrelations
            : this.partialCorrelations

        // set up canvases
        let container = this.$refs.container

        while (!container) {
          await pause(10)
          container = this.$refs.container
        }

        container.innerHTML = ""

        // get measurements
        await pause(10)
        const tempCanvas = createHighDPICanvas(100, 100)
        const tempContext = tempCanvas.getContext("2d")

        const fontSize = int(
          clamp(100 / correlations.values.length + 8, 10, 18),
        )

        tempContext.font = `${fontSize}px monospace`
        const characterMeasurements = tempContext.measureText("P")

        const characterHeight = int(
          characterMeasurements.actualBoundingBoxAscent +
          characterMeasurements.actualBoundingBoxDescent,
        )

        const labelLengths = correlations.columns.map(c => c.length)
        const longestLabel = correlations.columns[argmax(labelLengths)]

        const labelLength = tempContext.measureText(
          truncate(longestLabel, 32, store.settings.truncationMode),
        ).width

        const blockSize = int(characterHeight * 2)
        const tempPadding = 2 * blockSize

        const tempWidth =
          2 * tempPadding +
          labelLength +
          blockSize +
          blockSize * correlations.columns.length

        const width = int(tempWidth)
        const height = int(tempWidth)
        const padding = int(tempPadding)

        const gridTop = padding
        const gridBottom = height - padding - labelLength - blockSize
        const gridLeft = padding + labelLength + blockSize
        const horizontalLabels = []
        const verticalLabels = []

        await pause(10)

        correlations.index.forEach((row, i) => {
          const horizontalLabel = new Label(
            truncate(row, 32, store.settings.truncationMode),
            truncate(row, 64, store.settings.truncationMode),
            row,
            int(gridLeft - blockSize),
            int(gridTop + i * blockSize + blockSize / 2),
            Label.HORIZONTAL,
          )

          const verticalLabel = new Label(
            truncate(row, 32, store.settings.truncationMode),
            truncate(row, 64, store.settings.truncationMode),
            row,
            int(gridLeft + i * blockSize + blockSize / 2),
            int(gridBottom + blockSize),
            Label.VERTICAL,
          )

          horizontalLabels.push(horizontalLabel)
          verticalLabels.push(verticalLabel)
        })

        // draw on onscreen canvas
        await pause(10)

        const containerWidth =
          padding +
          labelLength +
          padding +
          correlations.shape[1] * blockSize +
          padding * 3

        const onscreenCanvas = createHighDPICanvas(
          containerWidth,
          containerWidth,
        )

        container.appendChild(onscreenCanvas)

        const onscreenContext = onscreenCanvas.getContext("2d")

        const innerMouse = {
          position: new Vector2(0, 0),
          isOverCanvas: false,
        }

        await pause(10)

        const loop = () => {
          try {
            if (this.shouldStop) {
              return
            }

            onscreenContext.clearRect(0, 0, containerWidth, containerWidth)
            onscreenContext.save()

            const row = int((innerMouse.position.y - gridTop) / blockSize)
            const col = int((innerMouse.position.x - gridLeft) / blockSize)

            const horizontalLabelsToHighlight = []
            const verticalLabelsToHighlight = []
            const blocksPerScreen = Math.ceil(containerWidth / blockSize)

            const startRow = clamp(
              int(-gridTop / blockSize),
              0,
              correlations.values.length,
            )

            const startCol = clamp(
              int(-gridLeft / blockSize),
              0,
              correlations.values.length,
            )

            // draw all blocks
            for (
              let i = startRow;
              i < min([startRow + blocksPerScreen, correlations.values.length]);
              i++
            ) {
              const tempRow = correlations.values[i]

              for (
                let j = startCol;
                j <
                min([startCol + blocksPerScreen, correlations.values.length]);
                j++
              ) {
                if (j + 1 > i) continue

                const value = tempRow[j]
                const x = gridLeft + j * blockSize
                const y = gridTop + i * blockSize
                onscreenContext.globalAlpha = abs(value)

                onscreenContext.fillStyle =
                  value < 0 ? this.colors.negative : this.colors.positive

                onscreenContext.fillRect(x, y, blockSize, blockSize)

                onscreenContext.globalAlpha = 1
                onscreenContext.strokeStyle = "rgb(200, 200, 200)"
                onscreenContext.lineWidth = 1
                onscreenContext.strokeRect(x, y, blockSize, blockSize)
              }
            }

            // draw semitransparent screen if there's a highlighted r-value
            if (this.highlightedRValue) {
              onscreenContext.fillStyle = getComputedStyle(
                this.$refs.container,
              ).getPropertyValue("background-color")

              onscreenContext.globalAlpha = 0.5
              onscreenContext.fillRect(0, 0, width, height)
            }

            if (
              innerMouse.isOverCanvas &&
              row >= 0 &&
              row < correlations.values.length &&
              col >= 0 &&
              col < correlations.columns.length
            ) {
              onscreenContext.strokeStyle = "black"
              onscreenContext.lineWidth = 2

              onscreenContext.strokeRect(
                gridLeft + col * blockSize,
                gridTop + row * blockSize,
                blockSize,
                blockSize,
              )

              const containerRect = container.getBoundingClientRect()

              const x =
                containerRect.left +
                gridLeft +
                col * blockSize -
                container.scrollLeft

              const y =
                containerRect.top +
                gridTop +
                row * blockSize -
                container.scrollTop

              const rowName = correlations.index[row]
              const colName = correlations.columns[col]

              // top label
              this.topFloatingLabel.isVisible = !this.mouse.buttonIsDown

              this.topFloatingLabel.content =
                this.chosenModeOption.value === "regularPairwiseCorrelationMode"
                  ? `r = ${correlations.values[row][col].toFixed(2)}`
                  : `r<sub>p</sub> = ${correlations.values[row][col].toFixed(2)}`

              this.topFloatingLabel.x = x + blockSize / 2
              this.topFloatingLabel.y = y - blockSize

              // bottom label
              this.bottomFloatingLabel.isVisible = !this.mouse.buttonIsDown

              this.bottomFloatingLabel.content = (() => {
                try {
                  if (
                    this.chosenModeOption.value ===
                    "regularPairwiseCorrelationMode"
                  ) {
                    return [
                      rowName,
                      "vs.",
                      colName,
                      `p = ${pValues.get(rowName, colName).toFixed(2)}`,
                    ].join("<br>")
                  } else {
                    return [
                      rowName,
                      "vs.",
                      colName,
                      `pairwise r = ${this.regularCorrelations
                        .get(rowName, colName)
                        .toFixed(2)}`,
                    ].join("<br>")
                  }
                } catch (e) {
                  this.bottomFloatingLabel.isVisible = false
                  return ""
                }
              })()

              this.bottomFloatingLabel.x = x + blockSize / 2
              this.bottomFloatingLabel.y = y + 2 * blockSize
            } else if (this.highlightedRValue) {
              correlations.values.forEach((row, i) => {
                if (i < startRow) return
                if (i > startRow + blocksPerScreen) return

                row.forEach((value, j) => {
                  if (j < startCol) return
                  if (j > startCol + blocksPerScreen) return
                  if (j + 1 > i) return
                  if (abs(value - this.highlightedRValue) > 0.025) return

                  if (horizontalLabelsToHighlight.indexOf(i) < 0) {
                    horizontalLabelsToHighlight.push(i)
                  }

                  if (verticalLabelsToHighlight.indexOf(j) < 0) {
                    verticalLabelsToHighlight.push(j)
                  }

                  const x = gridLeft + j * blockSize
                  const y = gridTop + i * blockSize
                  onscreenContext.globalAlpha = abs(value)

                  onscreenContext.fillStyle =
                    value < 0 ? this.colors.negative : this.colors.positive

                  onscreenContext.fillRect(x, y, blockSize, blockSize)

                  onscreenContext.globalAlpha = 1
                  onscreenContext.strokeStyle = "rgb(200, 200, 200)"
                  onscreenContext.lineWidth = 1
                  onscreenContext.strokeRect(x, y, blockSize, blockSize)
                })
              })
            }

            onscreenContext.font = `${fontSize}px monospace`
            onscreenContext.textAlign = "right"
            onscreenContext.textBaseline = "middle"

            if (gridLeft > 0) {
              horizontalLabels.forEach((label, i) => {
                if (this.highlightedRValue) {
                  onscreenContext.fillStyle =
                    horizontalLabelsToHighlight.indexOf(i) > -1
                      ? "black"
                      : "rgb(235, 235, 235)"
                } else {
                  onscreenContext.fillStyle = i === row ? "black" : "gray"
                }

                label.display(onscreenContext, fontSize)
              })
            }

            if (gridBottom < containerWidth) {
              verticalLabels.forEach((label, i) => {
                if (this.highlightedRValue) {
                  onscreenContext.fillStyle =
                    verticalLabelsToHighlight.indexOf(i) > -1
                      ? "black"
                      : "rgb(235, 235, 235)"
                } else {
                  onscreenContext.fillStyle = i === col ? "black" : "gray"
                }

                label.display(onscreenContext, fontSize)
              })
            }

            onscreenContext.restore()
            window.requestAnimationFrame(loop)
          } catch (e) {
            throw new Error(e)
          }
        }

        await pause(10)

        onscreenCanvas.addEventListener("mouseenter", () => {
          innerMouse.isOverCanvas = true
        })

        onscreenCanvas.addEventListener("mousemove", event => {
          if (!this.mouse.buttonIsDown) {
            innerMouse.isOverCanvas = true
            innerMouse.position.x = event.offsetX
            innerMouse.position.y = event.offsetY
          }
        })

        onscreenCanvas.addEventListener("mouseleave", () => {
          innerMouse.isOverCanvas = false
          this.topFloatingLabel.isVisible = false
          this.bottomFloatingLabel.isVisible = false
        })

        await pause(10)

        loop()

        await pause(10)

        // store points
        const cShape = correlations.shape
        const temp = []

        for (let i = 0; i < cShape[0]; i++) {
          for (let j = 0; j < cShape[1]; j++) {
            if (i !== j) {
              temp.push(correlations.values[i][j])
            }
          }
        }

        this.points = sort(set(temp))

        // turn on downloading
        this.canDownload = true
      },

      stop() {
        this.shouldStop = true
      },
    },

    async mounted() {
      await pause(100)
      this.redraw = debounce(this.redraw, 100, this)
      window.addEventListener("mouseup", this.onMouseUp)
      window.addEventListener("resize", this.redraw)
      this.chosenModeOption = this.modeOptions[0]
    },

    beforeUnmount() {
      this.stop()
      window.removeEventListener("mouseup", this.onMouseUp)
      window.removeEventListener("resize", this.redraw)
    },
  })

  if (options.shouldReturnComponentOnly) {
    return component
  }

  const app = createApp(component)

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { CorrelationsGridVisualization }
