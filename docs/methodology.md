# Methodology

The first implementation focuses on reproducible hospital-level operations analytics:

1. Ingest public CMS Timely and Effective Care Hospital rows from the Provider Data Catalog API.
2. Preserve raw rows before transformation.
3. Filter ED-related measures and normalize provider IDs, states, dates, measure IDs, and numeric scores.
4. Build dimensional tables for hospitals and measures.
5. Build fact tables for hospital-level ED measures and state-level summaries.
6. Run validation checks for row counts, numeric parsing, and missing OP_18B values.
7. Serve analytics through FastAPI and visualize them in React.

This project does not use patient-level records and does not generate clinical recommendations.
