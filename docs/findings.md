# Initial Findings

The main product finding is that EDFlow should be positioned as a closed-loop capacity orchestration layer rather than another passive ED flow dashboard. The current MVP demonstrates this through synthetic med-surg bed-conversion data: boarders, pending discharges, EVS turnover, transport, staffing, placement mismatch, ranked blockers, and next-best actions.

The repository still ships with local CMS seed data so the Evidence tab can run before a CMS ingest. Real CMS evidence findings should be regenerated after running:

```bash
python pipelines/ingest_cms.py --ed-only --max-rows 0
python pipelines/transform_cms.py
python pipelines/validate_data.py
python pipelines/build_modeling_dataset.py
```

The analyst report page reads from the same API contracts that will serve CMS-derived results. Those results support the product thesis but are no longer the primary product surface.
