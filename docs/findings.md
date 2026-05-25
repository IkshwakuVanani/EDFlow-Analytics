# Initial Findings

The repository currently ships with local seed data so the backend and frontend can run before a CMS ingest. Real findings should be regenerated after running:

```bash
python pipelines/ingest_cms.py --ed-only --max-rows 0
python pipelines/transform_cms.py
python pipelines/validate_data.py
python pipelines/build_modeling_dataset.py
```

The analyst report page reads from the same API contracts that will serve CMS-derived results.
