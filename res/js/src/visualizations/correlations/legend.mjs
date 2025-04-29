// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-correlations-legend .hvis-legend-canvas-container canvas {
		cursor: pointer;
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div
		ref="container"
		class="hvis-correlations-legend hvis-legend-canvas-container">
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { clamp, range, remap, reverse, set, sort } from "@jrc03c/js-math-tools"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { debounce } from "../../utils/index.mjs"
import { pause } from "@jrc03c/pause"

async function CorrelationsLegendComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-correlations-legend",
    template,

    props: {
      "color-negative": {
        type: String,
        required: false,
        default: () =>
          options.colors && options.colors.negative
            ? options.colors.negative
            : "orange",
      },

      "color-positive": {
        type: String,
        required: false,
        default: () =>
          options.colors && options.colors.positive
            ? options.colors.positive
            : "blue",
      },

      points: {
        type: Array,
        default: () => options.points || [],
      },
    },

    data() {
      return {
        css,
      }
    },

    watch: {
      points: {
        deep: true,

        handler() {
          this.redraw()
        },
      },
    },

    methods: {
      async redraw() {
        const fontSize = 10
        const width = fontSize * 7
        const height = fontSize * 32
        const padding = fontSize

        if (!this.$refs.container) return

        const container = this.$refs.container
        const canvas = createHighDPICanvas(width, height)
        container.innerHTML = ""
        container.appendChild(canvas)

        const context = canvas.getContext("2d")
        const resolution = parseInt((height - 2 * padding) / 20)
        const mouse = { x: -1, y: -1 }
        let isPaused = false

        // filter points to a manageable list
        let points = sort(set(this.points))

        await pause(10)

        const stepSize = 2 / (height - 2 * padding)
        const dict = {}

        points.forEach(p => {
          const index = parseInt(p / stepSize)
          if (!dict[index]) dict[index] = p
        })

        points = Object.keys(dict).map(key => dict[key])

        await pause(10)

        const loop = () => {
          try {
            if (isPaused) {
              window.requestAnimationFrame(loop)
              return
            }

            // clear canvas
            context.clearRect(0, 0, width, height)

            // draw gradient
            for (let i = 0; i < resolution; i++) {
              const x = padding

              const y = parseInt(
                remap(i, 0, resolution, padding, height - padding),
              )

              const w = padding
              const h = parseInt(height / resolution)

              if (i < resolution / 2) {
                context.fillStyle = this.colorNegative
                context.globalAlpha = remap(i, 0, resolution / 2, 1, 0)
              } else {
                context.fillStyle = this.colorPositive
                context.globalAlpha = remap(i, resolution / 2, resolution, 0, 1)
              }

              context.fillRect(x, y, w, h)
            }

            context.globalAlpha = 1

            // draw points
            points.forEach(v => {
              context.fillStyle = "rgba(0, 0, 0, 1)"
              const x = padding * 1.5
              const y = parseInt(remap(v, 1, -1, padding, height - padding))

              const r =
                mouse.x >= 0 &&
                mouse.y >= 0 &&
                Math.abs(y - mouse.y) <= 0.0125 * (height - 2 * padding)
                  ? 3
                  : 1

              context.beginPath()
              context.arc(x, y, r, 0, Math.PI * 2, false)
              context.fill()
            })

            // draw mouse line
            if (mouse.x >= 0 && mouse.y >= 0) {
              if (mouse.y > height / 2) {
                context.strokeStyle = this.colorPositive
                context.globalAlpha = remap(mouse.y, height / 2, height, 0, 1)
              } else {
                context.strokeStyle = this.colorNegative
                context.globalAlpha = remap(mouse.y, 0, height / 2, 1, 0)
              }

              context.lineWidth = 2
              context.beginPath()
              context.moveTo(padding, clamp(mouse.y, padding, height - padding))

              context.lineTo(
                width - padding,
                clamp(mouse.y, padding, height - padding),
              )

              context.stroke()
            }

            context.globalAlpha = 1

            // draw labels
            const labels = reverse(range(-1, 1.25, 0.25)).map(v =>
              v < 0 ? v.toFixed(2) : "+" + v.toFixed(2),
            )

            context.font = `${fontSize}px monospace`
            context.textAlign = "left"
            context.textBaseline = "middle"
            context.fillStyle = "rgb(74, 74, 74)"

            labels.forEach((label, i) => {
              const x = padding * 3

              const y = parseInt(
                remap(
                  i,
                  0,
                  labels.length - 1,
                  padding * 1.25,
                  height - padding * 1.25,
                ),
              )

              context.fillText(label, x, y)
            })

            window.requestAnimationFrame(loop)
          } catch (e) {
            throw new Error(e)
          }
        }

        canvas.addEventListener("mousemove", event => {
          mouse.x = event.offsetX
          mouse.y = event.offsetY

          const r = clamp(
            remap(mouse.y, padding, height - padding, 1, -1),
            -1,
            1,
          )

          this.$emit("hovered-over-value", r)
        })

        canvas.addEventListener("mouseleave", () => {
          mouse.x = -1
          mouse.y = -1
          this.$emit("hovered-over-value", null)
          loop()
          isPaused = true
        })

        canvas.addEventListener("mouseenter", () => {
          isPaused = false
        })

        loop()
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

export { CorrelationsLegendComponent }
