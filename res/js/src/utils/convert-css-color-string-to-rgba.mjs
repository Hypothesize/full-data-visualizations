function convertCSSColorStringToRGBA(color) {
  const div = document.createElement("div")

  div.style = `
    position: fixed;
    left: -999999px;
    top: -999999px;
    color: ${color};
  `

  document.body.appendChild(div)

  const style = getComputedStyle(div)
  const raw = style.getPropertyValue("color").split("(").at(-1).split(")")[0]
  const parts = raw.split(",").map(v => parseFloat(v.trim()))

  if (parts.length < 4) {
    parts.push(1)
  }

  document.body.removeChild(div)
  return parts
}

export { convertCSSColorStringToRGBA }
