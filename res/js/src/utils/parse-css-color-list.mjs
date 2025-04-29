import { assert, isString } from "@jrc03c/js-math-tools"

function parseCSSColorList(x) {
  assert(
    isString(x),
    "The value passed into the `parseCSSColorList` function must be a string representing a comma-separated list of CSS color values!",
  )

  const out = []
  let temp = ""
  let depth = 0

  for (let i = 0; i < x.length; i++) {
    const char = x[i]

    if (char === "(") {
      depth++
      temp += char
    } else if (char === ")") {
      depth--
      if (depth < 0) depth = 0
      temp += char
    } else if (char === ",") {
      if (depth > 0) {
        temp += char
      } else {
        out.push(temp.trim())
        temp = ""
      }
    } else {
      temp += char
    }
  }

  if (temp.length > 0) {
    out.push(temp.trim())
  }

  return out
}

export { parseCSSColorList }
