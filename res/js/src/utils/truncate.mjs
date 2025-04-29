import { int } from "@jrc03c/js-math-tools"

function truncate(text, n, mode) {
  const modes = ["beginning", "middle", "end"]
  if (!mode || modes.indexOf(mode) < 0) mode = "end"

  if (text.length > n) {
    if (mode === "beginning") {
      return "..." + text.substring(text.length - n + 3, text.length)
    } else if (mode === "middle") {
      return (
        text.substring(0, int(n / 2) - 1) +
        "..." +
        text.substring(text.length - int(n / 2) + 1, text.length)
      )
    } else if (mode === "end") {
      return text.substring(0, n - 3) + "..."
    }
  } else {
    return text
  }
}

export { truncate }
