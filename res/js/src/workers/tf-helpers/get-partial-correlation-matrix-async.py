import numpy as np
import pandas as pd
import pingouin

x = pd.DataFrame(np.random.normal(size=[1000, 25]))
x.columns = ["col" + str(i) for i in range(0, x.shape[1])]
x.to_csv("get-partial-correlation-matrix-x-from-pingouin.csv", index=False)

p = x.pcorr()
p.to_csv("get-partial-correlation-matrix-p-from-pingouin.csv", index=False)
