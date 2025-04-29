import { getConvexHull } from "@jrc03c/js-convex-hull"
import { max } from "@jrc03c/js-math-tools"

class Cluster {
  constructor(params) {
    this.centroid = params.centroid
    this.centroidIsUnderMouse = false
    this.centroidOrig = params.centroidOrig
    this.color = params.color
    this.hull =
      params.points.length > 2 ? getConvexHull(params.points) : params.points
    this.index = params.index
    this.isSelected = false
    this.points = params.points
    this.pointsIndices = params.pointsIndices
    this.title = params.title
  }

  display(context, mouse) {
    const width = context.canvas.width
    let radius = max([width / 400, 1])

    if (this.centroidIsUnderMouse) document.body.style.cursor = "pointer"
    context.fillStyle = this.color
    context.globalAlpha = 0.5

    if (this.centroidIsUnderMouse || this.isSelected) radius += 0.33

    // draw points
    this.points.forEach(p => {
      context.beginPath()
      context.arc(p[0], p[1], radius, 0, Math.PI * 2, false)
      context.fill()
    })

    context.globalAlpha = 1

    // draw hull
    const opacity = this.centroidIsUnderMouse || this.isSelected ? 1 : 0.5

    context.lineWidth = 2
    context.strokeStyle = this.color
    context.fillStyle = this.color

    context.beginPath()
    context.moveTo(this.hull[0][0], this.hull[0][1])

    this.hull
      .slice(1)
      .concat([this.hull[0]])
      .forEach(p => {
        context.lineTo(p[0], p[1])
      })

    context.globalAlpha = opacity / 5
    context.fill()
    context.globalAlpha = opacity
    context.stroke()
    context.globalAlpha = 1

    // draw centroid
    let scalar = 8

    if (this.centroidIsUnderMouse) {
      scalar = 10

      if (mouse.isClicked) {
        scalar = 12
      }
    }

    context.globalAlpha = 0.5
    context.fillStyle = this.color
    context.beginPath()

    context.arc(
      this.centroid[0],
      this.centroid[1],
      radius * scalar,
      0,
      Math.PI * 2,
      false,
    )

    context.fill()
    context.globalAlpha = 1

    // draw label
    if (this.centroidIsUnderMouse || this.isSelected) {
      const fontSize = max([width / 50, 8])
      context.font = `${fontSize}px monospace`

      context.drawLabel({
        text: this.title,
        x: this.centroid[0],
        y: this.centroid[1] - radius * 30,
      })
    }
  }
}

export { Cluster }
