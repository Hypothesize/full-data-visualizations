function pascalToKebab(x) {
  let out = ""

  x.split("").forEach(char => {
    const lowerChar = char.toLowerCase()

    if (char !== lowerChar && out.length > 0) {
      out += "-"
    }

    out += lowerChar
  })

  return out
}

export { pascalToKebab }
