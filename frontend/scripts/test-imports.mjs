import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

// Test the browser-independent CSV parser using the installed TypeScript compiler.
const source = readFileSync(new URL('../src/api/operations.ts', import.meta.url), 'utf8').replaceAll('import.meta.env', '({ DEV: true, VITE_API_BASE_URL: undefined })');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
const { parseCSV, csvFields } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const header = csvFields.join(',');

test('accepts a BOM, quoted fields, CRLF, and trailing newlines', () => {
  const rows = parseCSV('\uFEFF' + header + '\r\n"ed","2026-10-22T09:00:00-04:00",2,8,10,3,1,60\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].stage_id, 'ed');
  assert.equal(rows[0].waiting, 2);
  assert.equal(rows[0].observed_at, '2026-10-22T09:00:00-04:00');
});
test('maps reordered columns by name', () => {
  const fields = [...csvFields].reverse();
  const values = { stage_id: 'ed', observed_at: '2026-10-22T09:00:00Z', waiting: 2, occupied: 8, staffed_capacity: 10, arrivals: 3, departures: 1, interval_minutes: 60 };
  assert.deepEqual(parseCSV(fields.join(',') + '\n' + fields.map(key => values[key]).join(','))[0], values);
});
test('rejects missing or duplicate columns and empty input', () => {
  assert.throws(() => parseCSV(''), /CSV columns/);
  assert.throws(() => parseCSV(header), /between 1/);
  assert.throws(() => parseCSV(header.replace('waiting', 'occupied') + '\ned,2026-01-01T00:00:00Z,1,2,3,4,5,60'), /CSV columns/);
});
test('rejects malformed quotes, missing numeric values, fractions, and negatives', () => {
  assert.throws(() => parseCSV(header + '\n"ed,2026-01-01,1,2,3,4,5,60'), /Unclosed quote/);
  for (const invalid of ['', '1.2', '-1', 'Infinity', 'NaN']) {
    assert.throws(() => parseCSV(header + `\ned,2026-01-01T00:00:00Z,${invalid},2,3,4,5,60`), /nonnegative integer/);
  }
});
