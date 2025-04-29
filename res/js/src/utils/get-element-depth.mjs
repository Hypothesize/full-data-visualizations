function getElementDepth(el) {
  if (el.parentElement) {
    return getElementDepth(el.parentElement) + 1
  }

  return 1
}

export { getElementDepth }
