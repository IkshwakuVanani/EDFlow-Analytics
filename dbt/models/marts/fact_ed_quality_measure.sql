select
  provider_id,
  measure_id,
  score as score_raw,
  cast(nullif(regexp_replace(score, '[^0-9\\.]', '', 'g'), '') as numeric) as score_value,
  sample as sample_raw,
  footnote,
  start_date,
  end_date
from {{ ref('stg_timely_effective_care') }}
where measure_id in ('OP_18B', 'OP_18C', 'OP_22', 'OP_23', 'EDV')
