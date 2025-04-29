function getCSSVariableValue(v, el) {
  el = el || document.body
  return getComputedStyle(el).getPropertyValue(v)
}

export { getCSSVariableValue }
