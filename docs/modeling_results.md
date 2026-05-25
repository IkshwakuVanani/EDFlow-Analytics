# Modeling Results

The API includes model output endpoints backed by seed data at startup:

- `/models/outliers`
- `/models/clusters`
- `/models/high-risk-hospitals`
- `/models/feature-importance`
- `/models/model-summary`

After CMS ingestion and transformation, run `pipelines/build_modeling_dataset.py` to produce:

- `data/processed/modeling_dataset.csv`
- `data/processed/modeling_results.json`

Model metrics should be interpreted with data quality warnings and CMS reporting limitations.
