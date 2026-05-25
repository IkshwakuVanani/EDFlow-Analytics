# Data Dictionary

## Core Tables

| Table | Purpose |
| --- | --- |
| `raw_timely_effective_care` | Preserved CMS source rows from the Timely and Effective Care Hospital dataset. |
| `dim_hospital` | One row per hospital/provider with location and facility attributes. |
| `dim_location` | State and region lookup. |
| `dim_measure` | CMS ED measure metadata and units. |
| `fact_ed_quality_measure` | Hospital-measure observations with parsed numeric values where available. |
| `fact_state_ed_summary` | State-level aggregated ED performance by measure. |
| `data_quality_checks` | Pipeline row-count, missingness, and parsing checks. |
| `model_outliers` | Hospital-level outlier detection outputs. |
| `model_clusters` | Hospital ED performance cluster assignments. |
| `high_risk_hospitals` | Classification-style operational risk outputs. |
| `feature_importance` | Explainable feature weights for the baseline risk model. |

## ED Measures

| Measure | Meaning | Unit |
| --- | --- | --- |
| `OP_18B` | Median time from ED arrival to ED departure for discharged ED patients. | Minutes |
| `OP_18C` | Median time for psychiatric or mental health ED patients. | Minutes |
| `OP_22` | Left without being seen. | Percent |
| `OP_23` | Head CT/MRI result timing for acute stroke or hemorrhage patients. | Minutes |
| `EDV` | Emergency department volume. | Category |
