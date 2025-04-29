// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-snapshot-vis h2.hvis-title {
		margin-bottom: 0.5em;
	}

	.hvis-snapshot-vis .hvis-legend.hvis-row-centered {
		flex-wrap: wrap;
	}

	.hvis-snapshot-vis .hvis-legend-item.hvis-row-centered {
		flex-wrap: wrap;
		align-content: stretch;
		align-items: stretch;
		gap: calc(var(--padding) / 4);
	}

	.hvis-snapshot-vis .hvis-legend-box {
		width: 1em;
		height: 1em;
		display: block;
		border: var(--line-thickness) solid var(--color-gray-3);
		border-radius: var(--border-radius);
	}

	.hvis-snapshot-vis .hvis-legend-item .hvis-legend-label {
		font-size: var(--font-size-6);
		line-height: 1.5em;
	}

	.hvis-snapshot-vis .hvis-canvas-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: center;
		align-content: center;
		align-items: center;
	}

	.hvis-snapshot-vis .hvis-canvas-container img {
		cursor: pointer;
		border-radius: var(--border-radius);
		overflow: hidden;
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-snapshot-vis">
    <div class="hvis-card is-warning" style="margin-bottom: 2rem">
      <div class="hvis-card-content">
        <div class="hvis-content" style="display: flex; flex-direction: column; gap: 1rem"> 
          <p style="margin: auto">This shows the data type of every value in the columns of your table</p>
          <p style="margin: auto" v-if="cutMiddleValues">Since the table contains too many rows, only 1000 are shown here: the first and last 500</p>
        </div>
      </div>
    </div>
    <div>
			<div class="hvis-legend hvis-row-centered">
				<div
					:key="whichType"
					class="hvis-legend-item hvis-row-centered"
					v-for="whichType in presentDataTypes.filter(t => t !== 'number')">
					<div
						:style="'background-color: ' + colors[whichType]"
						class="hvis-legend-box">
					</div>

					<div class="hvis-legend-label">
						{{ whichType === "null" ? "empty" : whichType }}
					</div>
				</div>
			</div>

			<br />

			<p class="hvis-row-centered">
				{{ hypothesizeDataTypes.columns[0].length }} rows ⨯
				{{ hypothesizeDataTypes.columns.length }} columns
			</p>

			<div class="hvis-canvas-container" ref="container">
				<img
					:src="expandedCanvasDataURL"
					@click="toggleIsExpanded"
					v-if="isExpanded">

				<img
					:src="collapsedCanvasDataURL"
					@click="toggleIsExpanded"
					v-else>
			</div>
	</div>
</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"

import {
  debounce,
  getCSSVariableValue,
  loadImage,
  urlPathJoin,
} from "../utils/index.mjs"

import {
  distance,
  flatten,
  lerp,
  min,
  set,
  sort,
} from "@jrc03c/js-math-tools"

import { pause } from "@jrc03c/pause"
import { ProgressComponent } from "../components/progress.mjs"
import { store } from "../store/index.mjs"

const validDataTypes = {
  missing: "missing",
  decimal: "decimal",
  integer: "integer",
  date: "date",
  text: "text"
}

function drawDashedLine(context, x1, y1, x2, y2, dashLength) {
  const lineLength = distance([x1, y1], [x2, y2])
  dashLength = dashLength || 0.05 * lineLength
  const numberOfDashes = lineLength / dashLength
  context.beginPath()

  for (let i = 0; i < numberOfDashes; i++) {
    context.moveTo(
      lerp(x1, x2, (i + 0.25) / numberOfDashes),
      lerp(y1, y2, (i + 0.25) / numberOfDashes),
    )

    context.lineTo(
      lerp(x1, x2, (i + 0.75) / numberOfDashes),
      lerp(y1, y2, (i + 0.75) / numberOfDashes),
    )
  }

  context.stroke()
}

async function SnapshotVisualization(options, shouldReturnComponentOnly) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-snapshot-vis",

    components: {
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      return {
        canExpandAndCollapse: false,
        collapsedCanvas: null,
        collapsedCanvasDataURL: "",
        colors: {
          boolean:
            options.colors && options.colors.boolean
              ? options.colors.boolean
              : getCSSVariableValue("--vis-snapshot-color-boolean") ||
              "hsl(348, 100%, 61%)",
          date:
            options.colors && options.colors.date
              ? options.colors.date
              : getCSSVariableValue("--vis-snapshot-color-date") ||
              "hsl(48, 100%, 67%)",
          missing:
            options.colors && options.colors.empty
              ? options.colors.empty
              : getCSSVariableValue("--vis-snapshot-color-empty") ||
              "rgb(235, 235, 235)",
          decimal:
            options.colors && options.colors.float
              ? options.colors.float
              : getCSSVariableValue("--vis-snapshot-color-float") ||
              "hsl(204, 86%, 53%)",
          integer:
            options.colors && options.colors.integer
              ? options.colors.integer
              : getCSSVariableValue("--vis-snapshot-color-integer") ||
              "hsl(204, 86%, 75%)",
          null:
            options.colors && options.colors.empty
              ? options.colors.empty
              : getCSSVariableValue("--vis-snapshot-color-empty") ||
              "rgb(235, 235, 235)",
          number:
            options.colors && options.colors.number
              ? options.colors.number
              : getCSSVariableValue("--vis-snapshot-color-number") ||
              "hsl(204, 86%, 53%)",
          object:
            options.colors && options.colors.object
              ? options.colors.object
              : getCSSVariableValue("--vis-snapshot-color-object") || "#b542e0",
          text:
            options.colors && options.colors.string
              ? options.colors.string
              : getCSSVariableValue("--vis-snapshot-color-string") ||
              "hsl(141, 71%, 48%)",
        },
        css,
        expandedCanvas: null,
        expandedCanvasDataURL: "",
        isExpanded: false,
        isRendering: false,
        validDataTypes,
      }
    },

    computed: {
      presentDataTypes() {
        return ["text", "integer", "decimal", "date", "missing"]
      },
    },

    props: {
      hypothesizeDataTypes: {
        type: Object, // or Array/Object depending on its usage
        required: true,
        default: { shape: [0, 0], columns: [] },
      },
      cutMiddleValues: {
        type: Boolean,
        required: false,
        default: false
      }
    },

    methods: {
      async redraw() {
        while (!this.$refs.container) {
          await pause(100)
        }

        this.isRendering = true
        const colors = this.colors
        const dataShape = this.hypothesizeDataTypes.shape
        const dataAspect = dataShape[0] / dataShape[1]

        const container = this.$refs.container
        const containerRect = container.getBoundingClientRect()

        await pause(100)

        const smallestCellHeight = 4

        const cellSize = {
          x: Math.min(containerRect.width / dataShape[0], 192),
          y: Math.max(smallestCellHeight, 10000 / (dataShape[1] + 1000)),
        }

        const width = parseInt(cellSize.x * dataShape[0])
        const height = parseInt(cellSize.y * dataShape[1])

        const lineWidth = parseFloat(
          getCSSVariableValue("--vis-snapshot-cell-border-thickness"),
        )

        // draw on expanded canvas
        const expandedCanvas = createHighDPICanvas(width, height)
        const expandedContext = expandedCanvas.getContext("2d")
        expandedContext.fillStyle = "rgb(235, 235, 235)"
        expandedContext.fillRect(0, 0, width, height)

        expandedContext.strokeStyle = "white"
        expandedContext.lineWidth = lineWidth

        for (let i = 0; i < dataShape[0]; i++) {
          for (let j = 0; j < dataShape[1]; j++) {
            expandedContext.fillStyle =
              colors[this.hypothesizeDataTypes.columns[i][j]]

            expandedContext.fillRect(
              i * cellSize.x,
              j * cellSize.y,
              cellSize.x,
              cellSize.y,
            )

            if (
              min([cellSize.x, cellSize.y]) >= smallestCellHeight &&
              lineWidth > 0
            ) {
              expandedContext.strokeRect(
                i * cellSize.x,
                j * cellSize.y,
                cellSize.x,
                cellSize.y,
              )
            }
          }
        }

        // draw on collapsedCanvas
        const collapsedCanvasHeight = parseInt(width * 0.5)
        const collapsedCanvas = createHighDPICanvas(
          width,
          collapsedCanvasHeight,
        )
        const collapsedContext = collapsedCanvas.getContext("2d")

        await pause(100)

        const fadeImage = await loadImage(
          urlPathJoin(store.baseURL, store.imageDir, "fade.png"),
        )

        const scalar = expandedCanvas.width / width

        collapsedContext.drawImage(
          expandedCanvas.element,
          0,
          0,
          width,
          parseInt((scalar * collapsedCanvasHeight) / 2),
          0,
          0,
          width,
          parseInt(collapsedCanvasHeight / 2),
        )

        collapsedContext.drawImage(
          expandedCanvas.element,
          0,
          parseInt(height - collapsedCanvasHeight / 2),
          width,
          parseInt((scalar * collapsedCanvasHeight) / 2),
          0,
          parseInt(collapsedCanvasHeight / 2),
          width,
          parseInt(collapsedCanvasHeight / 2),
        )

        collapsedContext.drawImage(
          fadeImage,
          0,
          parseInt(collapsedCanvasHeight / 2 - fadeImage.height / 2),
          width,
          fadeImage.height,
        )

        collapsedContext.strokeStyle = "rgb(128, 128, 128)"
        collapsedContext.lineWidth = lineWidth

        drawDashedLine(
          collapsedContext,
          0,
          parseInt(collapsedCanvasHeight / 2),
          width,
          parseInt(collapsedCanvasHeight / 2),
        )

        collapsedContext.fillStyle = "white"
        collapsedContext.strokeStyle = "white"

        collapsedContext.fillRect(
          parseInt(width / 2 - 70),
          parseInt(collapsedCanvasHeight / 2 - 6),
          140,
          12,
        )

        if (
          min([cellSize.x, cellSize.y]) >= smallestCellHeight &&
          lineWidth > 0
        ) {
          collapsedContext.strokeRect(
            parseInt(width / 2 - 70),
            parseInt(collapsedCanvasHeight / 2 - 6),
            140,
            12,
          )
        }

        collapsedContext.font = `12px monospace`
        collapsedContext.textAlign = "center"
        collapsedContext.textBaseline = "middle"
        collapsedContext.fillStyle = "rgb(74, 74, 74)"

        collapsedContext.fillText(
          "(click to expand)",
          parseInt(width / 2),
          parseInt(collapsedCanvasHeight / 2),
        )

        this.collapsedCanvasDataURL = collapsedCanvas.toDataURL()
        this.expandedCanvasDataURL = expandedCanvas.toDataURL()

        if (dataAspect < 2 / 3) {
          this.canExpandAndCollapse = true
          expandedCanvas.addEventListener("click", () =>
            this.toggleIsExpanded(),
          )
          collapsedCanvas.addEventListener("click", () =>
            this.toggleIsExpanded(),
          )
          expandedCanvas.style.cursor = "pointer"
          collapsedCanvas.style.cursor = "pointer"
        } else {
          this.canExpandAndCollapse = false
          this.isExpanded = true
        }

        this.collapsedCanvas = collapsedCanvas
        this.expandedCanvas = expandedCanvas
        this.isRendering = false
      },

      sort,

      toggleIsExpanded() {
        if (this.canExpandAndCollapse) {
          this.isExpanded = !this.isExpanded
        }
      },
    },

    async mounted() {
      this.redraw = debounce(this.redraw, 100, this)
      this.redraw()
      window.addEventListener("resize", this.redraw)
    },

    beforeUnmount() {
      window.removeEventListener("resize", this.redraw)
    },
  })

  if (shouldReturnComponentOnly) {
    return component
  }

  const app = createApp({
    components: {
      "hvis-snapshot-vis": component,
    },

    template: `
			<hvis-snapshot-vis></hvis-snapshot-vis>
		`,
  }, {
    hypothesizeDataTypes: options.hypothesizeDataTypes,
    cutMiddleValues: options.cutMiddleValues
  })

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { SnapshotVisualization }