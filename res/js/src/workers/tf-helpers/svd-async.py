from numpy.linalg import svd
from numpy.random import random
import json

x = random([1000, 10])
u, s, vt = svd(x)

out = {
    "x": x.tolist(),
    "u": u.tolist(),
    "s": s.tolist(),
    "vt": vt.tolist(),
}

with open("svd-results-from-numpy.json", "w") as file:
    file.write(json.dumps(out))
