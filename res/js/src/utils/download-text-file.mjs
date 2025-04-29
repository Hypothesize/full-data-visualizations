function downloadJSONFile(filename, data) {
  return downloadTextFile(filename, data, "application/json")
}

function downloadTextFile(filename, data, mimetype) {
  mimetype = mimetype || "text/plain"
  const a = document.createElement("a")

  a.href =
    `data:${mimetype};charset=utf-8,` +
    encodeURIComponent(
      typeof data === "string" ? data : JSON.stringify(data, null, 2),
    )

  a.download = filename
  a.dispatchEvent(new MouseEvent("click"))
}

export { downloadJSONFile, downloadTextFile }
