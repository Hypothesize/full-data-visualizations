// string monkey-patches
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function (a, b) {
    return this.split(a).join(b)
  }
}
