function debounce(fn, ms, thisArg) {
  let timeout
  const fnBound = thisArg ? fn.bind(thisArg) : fn

  return () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(fnBound, ms)
  }
}

export { debounce }
