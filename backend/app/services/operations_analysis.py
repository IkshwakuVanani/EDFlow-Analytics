"""Descriptive statistics on timestamped stage snapshots. No AI or learned models."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import median


def utc(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def analyze(graph, rows, start, end):
    start, end = utc(start), utc(end)
    groups = defaultdict(list)
    for row in rows:
        groups[row.stage_id].append(row)
    stages, conclusions, warnings = [], [], []
    series = defaultdict(lambda: {'waiting': 0, 'occupied': 0, 'reporting_stages': 0})
    active = {node['id']: node for node in graph['nodes']}
    if not rows:
        warnings.append('No observations in this window. Import records or choose dates that include your data.')
    for node in graph['nodes']:
        records = sorted(groups[node['id']], key=lambda r: utc(r.observed_at))
        if not records:
            stages.append({**node, 'latest': None, 'samples': 0, 'queue_change': None, 'departures_per_hour': None, 'queue_slope_per_hour': None, 'projected_waiting_60m': None})
            warnings.append(f"{node['label']}: no observations in this window.")
            continue
        last = records[-1]
        for record in records:
            point = series[utc(record.observed_at).isoformat()]
            point['waiting'] += record.waiting
            point['occupied'] += record.occupied
            point['reporting_stages'] += 1
        age = (end - utc(last.observed_at)).total_seconds() / 60
        if age > 30:
            warnings.append(f"{node['label']}: latest observation is {round(age)} minutes before the window end.")
        # Each count covers the interval ending at observed_at. Only complete intervals
        # inside the selected window contribute to a rate; reject overlap at ingestion.
        intervals = [r for r in records if utc(r.observed_at) - timedelta(minutes=r.interval_minutes) >= start]
        hours = sum(r.interval_minutes for r in intervals) / 60
        rate = round(sum(r.departures for r in intervals) / hours, 2) if hours else None
        slope, projection = None, None
        if len(records) >= 3 and (utc(last.observed_at) - utc(records[0].observed_at)).total_seconds() >= 1800:
            xs = [(utc(r.observed_at) - utc(records[0].observed_at)).total_seconds() / 3600 for r in records]
            ys = [r.waiting for r in records]
            mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
            denom = sum((x - mx) ** 2 for x in xs)
            slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / denom if denom else 0
            if age <= 30:
                projection = round(max(0, my + slope * (xs[-1] + 1 - mx)), 1)
            slope = round(slope, 2)
        stages.append({**node, 'latest': {'observed_at': utc(last.observed_at).isoformat(), 'waiting': last.waiting, 'occupied': last.occupied, 'staffed_capacity': last.staffed_capacity, 'arrivals': last.arrivals, 'departures': last.departures, 'interval_minutes': last.interval_minutes}, 'samples': len(records), 'queue_change': last.waiting - records[0].waiting if len(records) > 1 else None, 'departures_per_hour': rate, 'queue_slope_per_hour': slope, 'projected_waiting_60m': projection})
    available = [s for s in stages if s['latest']]
    if available:
        largest = max(available, key=lambda s: s['latest']['waiting'])
        conclusions.append(f"Largest observed queue: {largest['label']} with {largest['latest']['waiting']} waiting at {largest['latest']['observed_at']}.")
        for stage in available:
            latest = stage['latest']
            if latest['occupied'] > latest['staffed_capacity']:
                conclusions.append(f"{stage['label']}: recorded occupancy exceeds staffed capacity by {latest['occupied'] - latest['staffed_capacity']}.")
            if stage['queue_change'] is not None and stage['queue_change'] > 0:
                conclusions.append(f"{stage['label']}: queue increased by {stage['queue_change']} across {stage['samples']} observations in the selected window.")
    points = [{'time': t, **v} for t, v in sorted(series.items())]
    complete = [p for p in points if p['reporting_stages'] == len(active)]
    if len(complete) != len(points):
        warnings.append('Some timestamps omit stages. The total chart includes only timestamps where every configured stage reported; stage details use their own observations.')
    for i, point in enumerate(complete):
        point['rolling_waiting'] = round(sum(p['waiting'] for p in complete[max(0, i-2):i+1]) / len(complete[max(0, i-2):i+1]), 1)
    gaps = [(datetime.fromisoformat(b['time']) - datetime.fromisoformat(a['time'])).total_seconds() / 60 for a, b in zip(complete, complete[1:])]
    return {'stages': stages, 'timeline': complete, 'conclusions': conclusions, 'warnings': warnings, 'observation_count': len(rows), 'complete_snapshots': len(complete), 'median_interval_minutes': median(gaps) if gaps else None, 'latest_observed_at': max((utc(r.observed_at).isoformat() for r in rows), default=None), 'window_start': start.isoformat(), 'window_end': end.isoformat(), 'methodology': 'Counts are submitted aggregate observations, not unique patient totals. The chart uses complete snapshots only. Rates use non-overlapping complete observation intervals within the window. Queue trends use ordinary least squares on actual elapsed hours (minimum 3 samples spanning 30 minutes). A 60-minute trend projection is shown only when the last sample is within 30 minutes of the window end. Projections are extrapolations, not validated forecasts or causal conclusions.'}
