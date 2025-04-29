import { sqrt } from "@jrc03c/js-math-tools"

class Vector2 {
  static add(a, b) {
    return a.copy().add(b)
  }

  static distance(a, b) {
    return a.copy().subtract(b).magnitude
  }

  static subtract(a, b) {
    return a.copy().subtract(b)
  }

  constructor(x, y) {
    this.x = x
    this.y = y
  }

  get magnitude() {
    return sqrt(this.dot(this))
  }

  add(v) {
    this.x += v.x
    this.y += v.y
    return this
  }

  copy() {
    return new Vector2(this.x, this.y)
  }

  dot(v) {
    return this.x * v.x + this.y * v.y
  }

  normalize() {
    const mag = this.magnitude

    if (mag === 0) {
      throw new Error(
        "The magnitude of this Vector2 is 0, so it cannot be normalized!",
      )
    }

    return this.scale(1 / mag)
  }

  scale(s) {
    this.x *= s
    this.y *= s
    return this
  }

  subtract(v) {
    this.x -= v.x
    this.y -= v.y
    return this
  }
}

export { Vector2 }
