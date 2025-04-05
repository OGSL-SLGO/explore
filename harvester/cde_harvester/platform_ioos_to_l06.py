import pandas as pd

# Load the pre-generated file (copied into the Docker image)
platforms_nerc_ioos = pd.read_csv('/usr/src/app/platforms_nerc_ioos.csv').fillna('')
