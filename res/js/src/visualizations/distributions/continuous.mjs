// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ ``

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-distribution-continuous-vis">
		<div class="hvis-row" v-if="isRendering">
			<div>Rendering...</div>
			<hvis-spinner></hvis-spinner>
		</div>

		<div ref="container"></div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { clamp, max, min, range, remap } from "@jrc03c/js-math-tools"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { debounce } from "../../utils/index.mjs"
import { formatDate } from "./format-date.mjs"
import { getTicks } from "./get-ticks.mjs"
import { pause } from "@jrc03c/pause"
import { SpinnerComponent } from "../../components/spinner.mjs"

function getSubset(points, n) {
  if (n >= points.length) return points
  const step = parseInt(points.length / n)
  const out = []

  for (let i = 0; i < points.length; i += step) {
    out.push(points[i])
  }

  return out
}

async function DistributionContinuousVisualization(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-distribution-continuous",

    components: {
      "hvis-spinner": await SpinnerComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    props: {
      color: {
        type: String,
        required: false,
        default: () => options.color || "blue",
      },

      "data-type": {
        type: String,
        required: false,
        default: () => options.dataType || "number",
      },

      points: {
        type: Array,
        required: false,
        default: () => options.points || [],
      },
    },

    data() {
      return {
        css,
        isRendering: true,
        maxPoints: 50,
      }
    },

    methods: {
      async redraw() {
        this.isRendering = true

        await pause(100)

        const points = getSubset(this.points, this.points.length)
        const container = this.$refs.container

        if (!container) {
          return
        }

        const rect = container.getBoundingClientRect()
        const width = rect.width
        const height = 256
        const padding = 32
        const canvas = createHighDPICanvas(width, height)
        const context = canvas.getContext("2d")
        container.innerHTML = ""
        container.appendChild(canvas)

        const xvalues = []
        const yvalues = []

        points.forEach(p => {
          xvalues.push(p[0])
          yvalues.push(p[1])
        })

        const xmin = min(xvalues)
        const xmax = max(xvalues)
        const ymin = min(yvalues.concat([0]))
        const ymax = max(yvalues)

        // draw axes
        context.strokeStyle = "gray"
        context.lineWidth = 2

        let vx = remap(0, xmin, xmax, padding, width - padding)

        const hy =
          remap(0, ymin, ymax, height - padding, padding) -
          (this.dataType === "date" ? 24 : 0)

        context.beginPath()
        context.moveTo(vx, padding)
        context.lineTo(vx, height - padding)
        context.stroke()

        context.beginPath()
        context.moveTo(padding, hy)
        context.lineTo(width - padding, hy)
        context.stroke()

        // draw ticks
        vx = clamp(vx, padding, width - padding)

        const xticks = getTicks(xvalues, width / 128)
        const yticks = range(0.25, 1.25, 0.25)

        context.font = "12px monospace"
        context.textAlign = "center"
        context.textBaseline = "top"
        context.fillStyle = "gray"

        xticks.forEach(tx => {
          const x = remap(tx, xmin, xmax, padding, width - padding)
          context.beginPath()
          context.moveTo(x, hy - 4)
          context.lineTo(x, hy + 4)
          context.stroke()

          // dates
          if (this.dataType === "date") {
            const txFormatted = formatDate(tx)
            const parts = txFormatted.split(" ")
            context.fillText(parts[0], x, hy + 8)
            context.fillText(parts[1], x, hy + 8 + 16)
          }

          // all other numbers
          else {
            let txFormatted = parseFloat(tx.toFixed(4))

            if (txFormatted === 0 || Math.abs(tx) > 10000) {
              txFormatted = tx.toExponential()
              const parts = txFormatted.split("e")
              txFormatted = parseFloat(parts[0]).toFixed(2) + "e" + parts[1]
            }

            context.fillText(txFormatted, x, hy + 8)
          }
        })

        context.textBaseline = "middle"

        yticks.forEach(ty => {
          const y = remap(ty, ymin, ymax, hy, padding)
          context.beginPath()
          context.moveTo(vx - 4, y)
          context.lineTo(vx + 4, y)
          context.stroke()

          const tyFormatted = parseFloat(ty.toFixed(4))
          context.textAlign = vx > width / 2 ? "right" : "left"
          context.fillText(tyFormatted, vx + (vx > width / 2 ? -8 : 8), y)
        })

        // draw polygon
        context.fillStyle = this.color
        context.globalAlpha = 0.25

        const start = [points[0][0], 0]
        const end = [points.at(-1)[0], 0]
        const polygonPoints = [start].concat(points).concat([end, start])

        context.beginPath()

        polygonPoints.forEach((p, i) => {
          const x = remap(p[0], xmin, xmax, padding, width - padding)
          const y = remap(p[1], ymin, ymax, hy, padding)

          if (i === 0) {
            context.moveTo(x, y)
          }

          context.lineTo(x, y)
        })

        context.fill()

        // draw line
        context.globalAlpha = 1
        context.strokeStyle = this.color
        context.lineWidth = 4
        context.beginPath()

        points.forEach((point, i) => {
          const x = remap(point[0], xmin, xmax, padding, width - padding)
          const y = remap(point[1], ymin, ymax, hy, padding)

          if (i === 0) {
            context.moveTo(x, y)
          }

          context.lineTo(x, y)
        })

        context.stroke()
        this.isRendering = false
      },
    },

    mounted() {
      this.redraw = debounce(this.redraw, 100, this)
      this.redraw()
      window.addEventListener("resize", this.redraw)
    },

    beforeUnmount() {
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

export { DistributionContinuousVisualization }
