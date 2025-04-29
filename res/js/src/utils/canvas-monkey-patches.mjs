import { clamp, int, max, min } from "@jrc03c/js-math-tools"
import { splitStringIntoSegmentsOfLengthN } from "./split-string-into-segments-of-length-n.mjs"

// canvas monkey-patches
if (typeof CanvasRenderingContext2D !== "undefined") {
  CanvasRenderingContext2D.prototype.fillRoundedRect = function (
    x,
    y,
    w,
    h,
    r,
  ) {
    this.save()
    this.translate(x, y)

    this.fillRect(r, 0, w - 2 * r, h)
    this.fillRect(0, r, w, h - 2 * r)

    this.beginPath()
    this.arc(r, r, r, 0, Math.PI * 2, false)
    this.arc(w - r, r, r, 0, Math.PI * 2, false)
    this.arc(w - r, h - r, r, 0, Math.PI * 2, false)
    this.arc(r, h - r, r, 0, Math.PI * 2, false)
    this.fill()

    this.restore()
  }

  CanvasRenderingContext2D.prototype.strokeRoundedRect = function (
    x,
    y,
    w,
    h,
    r,
  ) {
    this.save()
    this.translate(x, y)

    this.beginPath()

    this.moveTo(r, 0)
    this.lineTo(w - r, 0)

    this.arc(w - r, r, r, (3 * Math.PI) / 2, 2 * Math.PI, false)

    this.moveTo(w, r)
    this.lineTo(w, h - r)

    this.arc(w - r, h - r, r, 0, Math.PI / 2, false)

    this.moveTo(w - r, h)
    this.lineTo(r, h)

    this.arc(r, h - r, r, Math.PI / 2, Math.PI, false)

    this.moveTo(0, h - r)
    this.lineTo(0, r)

    this.arc(r, r, r, Math.PI, (3 * Math.PI) / 2, false)

    this.lineCap = "round"
    this.stroke()

    this.restore()
  }

  CanvasRenderingContext2D.prototype.drawLabel = function (params) {
    const text = params.text || ""
    let x = params.x || 0
    let y = params.y || 0
    const backgroundColor = params.backgroundColor || "white"
    const textColor = params.textColor || "black"
    const strokeColor = params.strokeColor || "black"
    const strokeWidth = params.strokeWidth || 2
    const horizontalAlignment = params.horizontalAlignment || "center"
    const verticalAlignment = params.verticalAlignment || "middle"

    const shouldClamp =
      typeof params.shouldClamp === "boolean" ? params.shouldClamp : true

    const dpi = window.devicePixelRatio
    const width = int(this.canvas.width / dpi)
    const height = int(this.canvas.height / dpi)

    const fogMeasurements = this.measureText("fog")

    const charHeight =
      fogMeasurements.actualBoundingBoxAscent +
      fogMeasurements.actualBoundingBoxDescent

    const padding = charHeight
    const innerWidth = width - 10 * padding
    const numberOfCharactersPerLine = 64

    const lines = text.split("\n")

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineWidth = this.measureText(line).width

      if (lineWidth > innerWidth) {
        const newLines = splitStringIntoSegmentsOfLengthN(
          line,
          numberOfCharactersPerLine,
        )

        newLines.forEach((newLine, j) => {
          if (j === 0) {
            lines[i] = newLine
          } else {
            lines.splice(i + j, 0, newLine)
          }
        })

        i += newLines.length
      }
    }

    const lineWidths = lines.map(line => this.measureText(line).width)
    const textWidth = max(lineWidths)
    const spaceBetweenLines = params.spaceBetweenLines || int(charHeight / 2)

    const totalHeight =
      lines.length * charHeight + (lines.length - 1) * spaceBetweenLines

    try {
      const left = int(textWidth / 2 + padding * 4)
      const right = int(width - textWidth / 2 - padding * 4)
      const top = int(totalHeight / 2 + padding * 4)
      const bottom = int(height - totalHeight / 2 - padding * 4)

      if (shouldClamp) {
        x = clamp(x, min([left, right]), max([left, right]))
        y = clamp(y, min([top, bottom]), max([top, bottom]))
      }
    } catch (e) {}

    // apply alignments
    if (horizontalAlignment === "left") x += int(textWidth / 2)
    if (horizontalAlignment === "right") x -= int(textWidth / 2)
    if (verticalAlignment === "top") y += int(totalHeight / 2)
    if (verticalAlignment === "bottom") y -= int(totalHeight / 2)

    // confirm that x and y are integers
    x = int(x)
    y = int(y)

    // draw box
    this.fillStyle = backgroundColor
    this.strokeStyle = strokeColor
    this.lineWidth = strokeWidth

    this.fillRoundedRect(
      x - int(textWidth / 2) - padding,
      y - int(totalHeight / 2) - padding,
      textWidth + 2 * padding,
      totalHeight + 2 * padding,
      4,
    )

    this.strokeRoundedRect(
      x - int(textWidth / 2) - padding,
      y - int(totalHeight / 2) - padding,
      textWidth + 2 * padding,
      totalHeight + 2 * padding,
      4,
    )

    // draw text
    this.textAlign = "center"
    this.textBaseline = "middle"
    this.fillStyle = textColor

    lines.forEach((line, i) => {
      this.fillText(
        line,
        x,
        y -
          int(totalHeight / 2) +
          i * (charHeight + spaceBetweenLines) +
          int(charHeight / 2) +
          int(charHeight / 10),
      )
    })
  }
}
