import { isString } from "@jrc03c/js-math-tools"
import { stringify } from "@jrc03c/js-text-tools"

function stringifyIfNotString(x) {
  if (isString(x)) {
    return x
  } else {
    return stringify(x) || ""
  }
}

function urlPathJoin() {
  return (
    (stringifyIfNotString(arguments[0]).startsWith("/") ? "/" : "") +
    Array.from(arguments)
      .map(arg =>
        stringifyIfNotString(arg)
          .replace(/^\/+/g, "")
          .replace(/\/+$/g, "")
          .trim()
      )
      .filter(p => p.length > 0)
      .join("/")
  )
}

export { urlPathJoin }
