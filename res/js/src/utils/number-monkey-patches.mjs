Number.prototype.toNonZeroFixed = function (n) {
  if (n < 0) {
    throw new Error(
      "The `toNonZeroFixed` function accepts only positive integers!",
    )
  }

  if (n > 16) {
    throw new Error("The `toNonZeroFixed` only works up to 16 digits!")
  }

  if (isNaN(this)) {
    return "NaN"
  }

  n = parseInt(n)

  const selfString = this.toFixed(16)

  if (this.valueOf() === parseInt(this.valueOf())) {
    return this.toFixed(n)
  }

  const parts = selfString.split(".")
  const left = parts[0]
  const right = parts[1]
  let out = left + "."
  let i = 0
  let hasStartedCounting = false

  right.split("").forEach(char => {
    if (char !== "0") hasStartedCounting = true
    if (hasStartedCounting) i++
    if (i <= n) out += char
  })

  return out
}
