function leftPad(x, n) {
	x = x.toString()
	while (x.length < n) x = "0" + x
	return x
}

export { leftPad }
