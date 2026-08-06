// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-correlations-grid-vis {
		max-width: 100%;
		overflow: hidden;
		position: relative;
    height: 100%;
	}

  .hvis-correlations-grid-vis > div {
		height: 100%;
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
    height: 100%;
		max-height: 75vh;
		overflow: auto;
		border-radius: 4px;
		position: relative;
	}

	.hvis-correlations-grid-vis canvas {
		max-width: unset !important;
	}

	.hvis-correlations-grid-vis .hvis-canvas-spacer {
		max-width: unset !important;
		max-height: unset !important;
		flex-shrink: 0;
	}

	/* pinned over the visible part of the spacer as the container scrolls */
	.hvis-correlations-grid-vis .hvis-canvas-spacer > high-dpi-canvas {
		position: sticky;
		top: 0;
		left: 0;
		display: block;
	}

	.hvis-correlations-grid-vis .hvis-correlations-legend-container {
		position: absolute;
		right: 24px;
		z-index: 1;
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
    style="text-align: left"
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

		<div v-else style="position: relative; display: inline-block; max-width: 100%">
			<div v-if="modeOptions.length > 1" class="hvis-mode-options-container">
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
					:color-negative="colors.positive"
					:color-positive="colors.negative"
					:points="points"
					@hovered-over-value="highlightRValue"
					v-if="canDownload">
				</hvis-correlations-legend>
			</div>

			<div ref="container" class="hvis-canvas-container"></div>

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

import { argmax, clamp, int } from "@jrc03c/js-math-tools"
import { CorrelationsLegendComponent } from "../legend.mjs"
import { createApp, markRaw } from "vue/dist/vue.esm-bundler.js"
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

// floor for the measured width, so a mid-layout measurement can never collapse
// the grid to nothing
const MIN_GRID_WIDTH = 240

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
        modeOptions: options.modeOptions ?? [
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
        partialCorrelations: options.partialCorrelations
          ? markRaw(options.partialCorrelations)
          : null,
        points: [],
        progress: {
          message: "Computing...",
          percent: 0,
        },
        error: null,
        pValues: options.pValues ? markRaw(options.pValues) : null,
        regularCorrelations: options.regularCorrelations
          ? markRaw(options.regularCorrelations)
          : null,
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
        // NOTE: The on-screen canvas only holds the visible portion of the
        // matrix, so we render the whole thing off-screen just for the export.
        const canvas = this._renderFull
          ? this._renderFull()
          : this.$refs.container.querySelector("high-dpi-canvas")

        if (!canvas) return

        const a = document.createElement("a")
        a.href = canvas.toDataURL()
        a.download = "correlation-grid.png"
        a.dispatchEvent(new MouseEvent("click"))
      },

      highlightRValue(r) {
        this.highlightedRValue = r
        if (this._scheduleDraw) this._scheduleDraw()
      },

      onMouseDown(event) {
        this.mouse.buttonIsDown = true
        this.mouse.x = event.clientX
        this.mouse.y = event.clientY
        document.body.style.cursor = "grabbing"
        if (this._scheduleDraw) this._scheduleDraw()
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
        if (this._scheduleDraw) this._scheduleDraw()
      },

      async redraw() {
        this.stop()
        await pause(10)
        this.shouldStop = false

        // NOTE: `shouldStop` alone can't reliably retire the previous render
        // loop, because we clear it again after a delay shorter than a frame.
        // This generation number does it deterministically: any loop from an
        // earlier `redraw` sees a newer generation and bails.
        const generation = ++this._loopGeneration

        await pause(10)

        this.isComputing = true

        if (this.regularCorrelations === null || (this.modeOptions.length === 2 && this.partialCorrelations === null) || this.pValues === null) {
          const results = this.regularCorrelations ?? await store.getCorrelationsAndPValues(null, p => {
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
            ? markRaw(results.regularCorrelations)
            : results.regularCorrelations

          this.partialCorrelations = results.partialCorrelations
            ? markRaw(results.partialCorrelations)
            : results.partialCorrelations

          this.pValues = results.pValues
            ? markRaw(results.pValues)
            : results.pValues
        }

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

        const height = int(tempWidth)
        const padding = int(tempPadding)

        const gridTop = 0
        const gridBottom = height - padding - labelLength - blockSize
        const gridLeft = 0 + labelLength + blockSize
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
            int(gridBottom + blockSize) - padding,
            Label.VERTICAL,
          )

          horizontalLabels.push(horizontalLabel)
          verticalLabels.push(verticalLabel)
        })

        // draw on onscreen canvas
        await pause(10)

        const containerWidth =
          0 +
          labelLength +
          0 +
          correlations.shape[1] * blockSize
          // If there are not enough columns to fill the screen, we add some width, so the floating legend don't overflow into the matrix
          + (correlations.shape[1] * blockSize >= 450 ? 0 : blockSize * 5)

        const containerHeight =
          0 +
          labelLength +
          padding +
          correlations.shape[0] * blockSize

        // NOTE: A canvas covering the whole matrix is unaffordable once there
        // are a few hundred columns: its backing store is (size * dpi)^2 * 4
        // bytes, which passes a gigabyte around 500 columns and eventually
        // exceeds what the browser will allocate at all. So instead we lay out
        // a spacer at the full size of the matrix — which is what gives the
        // container its scrollbars — and keep the canvas itself only as big as
        // the visible scrollport, redrawing the cells that scroll into view.
        // NOTE: Measure the room available to the grid *before* putting
        // anything into the container. A scroll container with `width: auto`
        // sizes itself to its content, so once the full-size spacer is inside
        // it the container reports the width of the entire matrix — and if any
        // ancestor is shrink-to-fit (an inline-block, or a flex/grid item with
        // the default `min-width: auto`) it grows to match rather than letting
        // the container overflow. The result is scrollWidth === clientWidth,
        // i.e. nothing to scroll horizontally. Pinning an explicit pixel width
        // is what stops that, and it can't be undone by an ancestor's layout.
        container.style.width = ""

        const rootWidth = this.$refs.root ? this.$refs.root.clientWidth : 0

        const roomToViewportEdge =
          document.documentElement.clientWidth -
          container.getBoundingClientRect().left

        const availableWidth = Math.max(
          MIN_GRID_WIDTH,
          Math.min(rootWidth || Infinity, roomToViewportEdge),
        )

        const viewWidth = Math.min(availableWidth, containerWidth)
        container.style.width = `${viewWidth}px`

        const spacer = document.createElement("div")
        spacer.className = "hvis-canvas-spacer"
        spacer.style.width = `${containerWidth}px`
        spacer.style.height = `${containerHeight}px`
        container.appendChild(spacer)

        const viewHeight = Math.min(
          container.clientHeight || window.innerHeight,
          containerHeight,
        )

        // The canvas sticks to the top-left of the scrollport rather than being
        // absolutely positioned and translated: a transformed element's bounds
        // feed back into the scrollable overflow area, which would let the
        // scroll extent grow as the user pans.
        const onscreenCanvas = createHighDPICanvas(viewWidth, viewHeight)
        spacer.appendChild(onscreenCanvas)

        const onscreenContext = onscreenCanvas.getContext("2d")

        const innerMouse = {
          position: new Vector2(0, 0),
          isOverCanvas: false,
        }

        // constant for the life of this canvas, and reading it forces a style
        // recalculation, so it doesn't belong inside the draw path
        const containerBackgroundColor = getComputedStyle(
          container,
        ).getPropertyValue("background-color")

        await pause(10)

        const rowCount = correlations.values.length
        const colCount = correlations.columns.length

        // Paints the cells in [startRow, endRow) x [startCol, endCol) onto any
        // context, in matrix coordinates. Shared by the on-screen (virtualized)
        // draw and by the full-size render used for image export.
        const paintCells = (context, startRow, endRow, startCol, endCol) => {
          for (let i = startRow; i < endRow; i++) {
            const tempRow = correlations.values[i]

            for (let j = startCol; j < endCol; j++) {
              if (j + 1 > i) continue

              const value = tempRow[j]
              const x = gridLeft + j * blockSize
              const y = gridTop + i * blockSize
              context.globalAlpha = Math.abs(value)

              context.fillStyle = Number.isNaN(value)
                ? "#ddd"
                : value < 0
                  ? this.colors.negative
                  : this.colors.positive

              context.fillRect(x, y, blockSize, blockSize)

              context.globalAlpha = 1
              context.strokeStyle = "rgb(200, 200, 200)"
              context.lineWidth = 1
              context.strokeRect(x, y, blockSize, blockSize)
            }
          }
        }

        // Same idea for the row and column labels. `highlighted` is the set of
        // indices to render in black (everything else is greyed out); when it's
        // null, `activeIndex` is the single hovered row/column instead.
        const paintLabels = (
          context,
          labels,
          start,
          end,
          highlighted,
          activeIndex,
        ) => {
          const last = Math.min(end, labels.length)

          for (let i = start; i < last; i++) {
            if (highlighted) {
              context.fillStyle = highlighted.has(i)
                ? "black"
                : "rgb(235, 235, 235)"
            } else {
              context.fillStyle = i === activeIndex ? "black" : "gray"
            }

            labels[i].display(context, fontSize)
          }
        }

        // Renders the whole matrix at full size onto a throwaway canvas. This
        // is what image export uses, since the on-screen canvas now only ever
        // holds the visible portion.
        this._renderFull = () => {
          const canvas = createHighDPICanvas(containerWidth, containerHeight)
          const context = canvas.getContext("2d")

          context.fillStyle = "white"
          context.fillRect(0, 0, containerWidth, containerHeight)

          paintCells(context, 0, rowCount, 0, colCount)

          context.font = `${fontSize}px monospace`
          context.textAlign = "right"
          context.textBaseline = "middle"

          if (gridLeft > 0) {
            paintLabels(context, horizontalLabels, 0, rowCount, null, -1)
          }

          if (gridBottom < containerWidth) {
            paintLabels(context, verticalLabels, 0, colCount, null, -1)
          }

          return canvas
        }

        const draw = () => {
          try {
            const scrollLeft = container.scrollLeft
            const scrollTop = container.scrollTop

            // We cover the canvas with white before we draw anything on it
            onscreenContext.fillStyle = "white"
            onscreenContext.fillRect(0, 0, viewWidth, viewHeight)

            onscreenContext.save()

            // From here on we draw in matrix coordinates and let the canvas
            // translation account for how far the container is scrolled.
            onscreenContext.translate(-scrollLeft, -scrollTop)

            const row = int(
              (innerMouse.position.y + scrollTop - gridTop) / blockSize,
            )

            const col = int(
              (innerMouse.position.x + scrollLeft - gridLeft) / blockSize,
            )

            const horizontalLabelsToHighlight = new Set()
            const verticalLabelsToHighlight = new Set()

            // the range of cells currently scrolled into view (one extra block
            // on each side so partially visible cells still get drawn)
            const startRow = clamp(
              Math.floor((scrollTop - gridTop) / blockSize),
              0,
              rowCount,
            )

            const endRow = clamp(
              Math.ceil((scrollTop + viewHeight - gridTop) / blockSize) + 1,
              0,
              rowCount,
            )

            const startCol = clamp(
              Math.floor((scrollLeft - gridLeft) / blockSize),
              0,
              colCount,
            )

            const endCol = clamp(
              Math.ceil((scrollLeft + viewWidth - gridLeft) / blockSize) + 1,
              0,
              colCount,
            )

            // draw the visible blocks
            paintCells(onscreenContext, startRow, endRow, startCol, endCol)

            // draw semitransparent screen if there's a highlighted r-value
            if (this.highlightedRValue) {
              onscreenContext.fillStyle = containerBackgroundColor
              onscreenContext.globalAlpha = 0.5

              onscreenContext.fillRect(
                scrollLeft,
                scrollTop,
                viewWidth,
                viewHeight,
              )
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
                      `p = ${this.pValues.get(rowName, colName).toFixed(2)}`,
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
              for (let i = startRow; i < endRow; i++) {
                const tempRow = correlations.values[i]

                for (let j = startCol; j < endCol; j++) {
                  if (j + 1 > i) continue

                  const value = tempRow[j]

                  if (
                    Number.isNaN(value) ||
                    Math.abs(value - this.highlightedRValue) > 0.025
                  ) {
                    continue
                  }

                  horizontalLabelsToHighlight.add(i)
                  verticalLabelsToHighlight.add(j)

                  const x = gridLeft + j * blockSize
                  const y = gridTop + i * blockSize
                  onscreenContext.globalAlpha = Math.abs(value)

                  onscreenContext.fillStyle =
                    value < 0 ? this.colors.negative : this.colors.positive

                  onscreenContext.fillRect(x, y, blockSize, blockSize)

                  onscreenContext.globalAlpha = 1
                  onscreenContext.strokeStyle = "rgb(200, 200, 200)"
                  onscreenContext.lineWidth = 1
                  onscreenContext.strokeRect(x, y, blockSize, blockSize)
                }
              }
            }

            onscreenContext.font = `${fontSize}px monospace`
            onscreenContext.textAlign = "right"
            onscreenContext.textBaseline = "middle"

            // only the labels alongside the visible rows and columns
            const highlighting = this.highlightedRValue ? true : false

            if (gridLeft > 0) {
              paintLabels(
                onscreenContext,
                horizontalLabels,
                startRow,
                endRow,
                highlighting ? horizontalLabelsToHighlight : null,
                row,
              )
            }

            if (gridBottom < containerWidth) {
              paintLabels(
                onscreenContext,
                verticalLabels,
                startCol,
                endCol,
                highlighting ? verticalLabelsToHighlight : null,
                col,
              )
            }

            onscreenContext.restore()
          } catch (e) {
            throw new Error(e)
          }
        }

        // NOTE: The grid only changes when the user interacts with it, so we
        // draw in response to events rather than on every animation frame.
        // Repainting a wide matrix means tens of thousands of rects, which is
        // far too much to do 60 times a second. Draws are still coalesced
        // through requestAnimationFrame so that a burst of events (e.g. a
        // mousemove and a scroll in the same frame) only paints once.
        const scheduleDraw = () => {
          if (this.shouldStop || generation !== this._loopGeneration) return
          if (this._rafHandle) return

          this._rafHandle = window.requestAnimationFrame(() => {
            this._rafHandle = null
            if (this.shouldStop || generation !== this._loopGeneration) return
            draw()
          })
        }

        this._scheduleDraw = scheduleDraw

        await pause(10)

        onscreenCanvas.addEventListener("mouseenter", () => {
          innerMouse.isOverCanvas = true
          scheduleDraw()
        })

        onscreenCanvas.addEventListener("mousemove", event => {
          if (!this.mouse.buttonIsDown) {
            innerMouse.isOverCanvas = true
            innerMouse.position.x = event.offsetX
            innerMouse.position.y = event.offsetY
            scheduleDraw()
          }
        })

        onscreenCanvas.addEventListener("mouseleave", () => {
          innerMouse.isOverCanvas = false
          this.topFloatingLabel.isVisible = false
          this.bottomFloatingLabel.isVisible = false
          scheduleDraw()
        })

        // panning scrolls the container, which moves the floating labels;
        // the container outlives each redraw, so drop the previous listener
        if (this._scrollTarget && this._onScroll) {
          this._scrollTarget.removeEventListener("scroll", this._onScroll)
        }

        this._scrollTarget = container
        this._onScroll = scheduleDraw
        container.addEventListener("scroll", scheduleDraw)

        await pause(10)

        scheduleDraw()

        await pause(10)

        // Store points for the legend. NOTE: There are n^2 r-values, but the
        // legend only plots a few hundred of them (it bins by pixel row), so
        // we deduplicate at a much finer resolution than it draws instead of
        // handing it a quarter of a million numbers to sort and diff.
        const cShape = correlations.shape
        const seen = new Set()
        const temp = []

        for (let i = 0; i < cShape[0]; i++) {
          const tempRow = correlations.values[i]

          for (let j = 0; j < cShape[1]; j++) {
            if (i === j) continue

            const value = tempRow[j]
            if (!Number.isFinite(value)) continue

            const key = Math.round(value * 1000)

            if (!seen.has(key)) {
              seen.add(key)
              temp.push(value)
            }
          }
        }

        this.points = temp.sort((a, b) => a - b)

        // turn on downloading
        this.canDownload = true
      },

      stop() {
        this.shouldStop = true
        this._scheduleDraw = null
        this._renderFull = null

        if (this._rafHandle) {
          window.cancelAnimationFrame(this._rafHandle)
          this._rafHandle = null
        }

        if (this._scrollTarget && this._onScroll) {
          this._scrollTarget.removeEventListener("scroll", this._onScroll)
          this._scrollTarget = null
          this._onScroll = null
        }
      },
    },

    async mounted() {
      this._loopGeneration = 0
      this._rafHandle = null
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
