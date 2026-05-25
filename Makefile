.PHONY: backend frontend test ingest transform validate modeling

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0

test:
	cd backend && pytest

ingest:
	python pipelines/ingest_cms.py --ed-only --max-rows 15000

transform:
	python pipelines/transform_cms.py

validate:
	python pipelines/validate_data.py

modeling:
	python pipelines/build_modeling_dataset.py
