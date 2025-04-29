import { Vector2 } from "../../../utils/index.mjs"

class Label {
  static HORIZONTAL = "horizontal"
  static VERTICAL = "vertical"

  constructor(shortText, longText, fullText, x, y, orientation) {
    this.fullText = fullText
    this.longText = longText
    this.orientation = orientation
    this.position = new Vector2(x, y)
    this.shortText = shortText
  }

  display(context) {
    context.save()
    context.translate(this.position.x, this.position.y)

    if (this.orientation === Label.VERTICAL) {
      context.rotate(-Math.PI / 2)
    }

    context.fillText(this.shortText, 0, 0)
    context.restore()
    return this
  }
}

export { Label }
