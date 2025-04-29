import { abs, max, remap } from "@jrc03c/js-math-tools"
import { convertCSSColorStringToRGBA, Vector2 } from "../../utils/index.mjs"

class Point {
  static COLOR_NEGATIVE = "orange"
  static COLOR_POSITIVE = "blue"

  constructor(shortName, longName, fullName, value) {
    this.fullName = fullName
    this.isActivated = false
    this.isBeingClicked = false
    this.longName = longName
    this.position = null
    this.radius = 0
    this.shortName = shortName
    this.value = value

    const rgba = convertCSSColorStringToRGBA(
      this.value < 0 ? Point.COLOR_NEGATIVE : Point.COLOR_POSITIVE,
    )

    const r = rgba[0]
    const g = rgba[1]
    const b = rgba[2]
    const a = abs(this.value)
    this.color = `rgba(${r}, ${g}, ${b}, ${a})`
  }

  display(context, padding, barHeight, isHovered, labelIsTranslucent) {
    const dpi = window.devicePixelRatio
    const width = context.canvas.width / dpi
    const height = context.canvas.height / dpi

    if (!this.radius) this.radius = max([barHeight / 3, 5])
    let radius = this.isActivated ? this.radius * 1.25 : this.radius
    if (this.isBeingClicked) radius *= 1.5
    const x = remap(this.value, -1, 1, padding, width - padding)
    const y = height - padding - barHeight / 2
    if (!this.position) this.position = new Vector2(x, y)

    context.save()
    context.translate(x, y)

    context.fillStyle = this.color
    context.strokeStyle = this.isActivated ? "black" : "gray"
    context.lineWidth = Math.round(width / 400)

    context.beginPath()
    context.arc(0, 0, radius, 0, Math.PI * 2, false)
    context.fill()
    context.stroke()

    context.restore()

    if (this.isActivated || isHovered) {
      if (labelIsTranslucent) {
        context.globalAlpha = 0.1
      }

      context.strokeStyle = "black"
      context.beginPath()
      context.moveTo(x, y - radius)
      context.lineTo(x, y - padding * 1.5)
      context.stroke()

      context.drawLabel({
        text: `${
          isHovered ? this.fullName : this.shortName
        } (${this.value.toFixed(2)})`,
        x: x,
        y: y - padding * 1.5,
        verticalAlignment: "bottom",
        shouldClamp: true,
      })

      context.globalAlpha = 1
    }

    return this
  }
}

export { Point }
