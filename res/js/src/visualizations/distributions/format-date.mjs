import { cast } from "@jrc03c/js-math-tools"
import { leftPad } from "../../utils/index.mjs"

function formatDate(date) {
  date = cast(date, "date")

  try {
    if (date) {
      const year = date.getFullYear()
      const month = leftPad(date.getMonth() + 1, 2)
      const day = leftPad(date.getDate(), 2)
      const hours = leftPad(date.getHours(), 2)
      const minutes = leftPad(date.getMinutes(), 2)
      const seconds = leftPad(date.getSeconds(), 2)
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
  } catch (e) {
    console.error(e)
  }

  return "Invalid Date"
}

export { formatDate }
