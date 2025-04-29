function splitStringIntoSegmentsOfLengthN(s, n) {
  const out = []

  for (let i = 0; i < s.length; i += n) {
    out.push(s.substring(i, i + n))
  }

  return out
}

export { splitStringIntoSegmentsOfLengthN }
