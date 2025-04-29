from numpy import array, mean, std
from numpy.random import normal
from sklearn.decomposition import PCA
import json


def normalize(x):
    return (x - mean(x)) / std(x)


x = array([normalize(row) for row in normal(size=[1000, 10]).T]).T.tolist()

pca = PCA()
pca.fit(x)
loadings = pca.components_.T.tolist()
eigenvalues = (pca.singular_values_**2).tolist()

out = {"x": x, "loadings": loadings, "eigenvalues": eigenvalues}

with open("pca-results-from-sklearn.json", "w") as file:
    file.write(json.dumps(out))
