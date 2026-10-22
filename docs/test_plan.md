# Verification

## Automated checks

```bash
python -m pytest
npm test --prefix frontend
npm run build --prefix frontend
```

Backend tests cover account isolation, revoked sessions, saved graphs, version conflicts, CSV batch validation and atomic import, duplicate/conflicting observations, non-overlapping count intervals, missing stages, stale data, elapsed-time trend calculations, invitation consumption, shared task updates, and action history. Legacy CMS contract tests explicitly opt into historical fixtures; the operations deployment does not seed records.

Frontend import tests cover quoted CSV, BOM/CRLF, reordered columns, missing/duplicate columns, malformed quotes, and invalid counts.

## Browser acceptance

1. Register, create a hospital, add three stages and two connections, and save the flow.
2. Upload observations for all stages at matching timestamps. Validate, then save; verify record counts and conclusions use the uploaded values.
3. Export CSV and the analysis report. Check their fields and timestamps.
4. Create a task, change its owner/status/notes, and inspect history.
5. Reload and verify the flow, observations, and action state remain saved.
6. Join a second account using an invitation. Verify shared updates appear on polling and unrelated accounts cannot access the hospital.
7. Edit concurrently. Saving an outdated graph/task version must return a conflict and preserve the local draft.
8. Check at 1440px desktop and 390px mobile. Buttons must remain usable and the page must not overflow horizontally; wide tables and flow maps scroll inside their cards.
9. Disconnect the API. Show a connection error and keep previously loaded data visibly stale; never substitute sample data.

The local browser pass used an explicitly named “Operations validation hospital” and test observations, not real hospital or patient records. The three README screenshots show that verification workspace.
