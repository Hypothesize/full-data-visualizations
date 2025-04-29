# converts a CSV to a JSON object compatible with js-math-tools' DataFrame constructor
import pandas as pd
import json

files = [
	"part.corr.matrix.estimate.abalone.csv",
	"part.corr.matrix.estimate.adult.csv",
	"part.corr.matrix.estimate.mushrooms.csv",
]

for file in files:
	df = pd.read_csv(file)
	df.index = df["Unnamed: 0"]
	df = df.drop(labels=["Unnamed: 0"], axis=1)
	
	out = {
		"values": list(map(lambda row: list(row), df.values)),
		"columns": list(df.columns),
		"index": list(map(lambda i: str(i), df.index)),
	}

	with open(file + ".json", "w") as which:
		which.write(json.dumps(out))