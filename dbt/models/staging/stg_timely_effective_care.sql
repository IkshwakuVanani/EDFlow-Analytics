select
  facility_id as provider_id,
  facility_name,
  address,
  citytown as city,
  state,
  zip_code,
  countyparish as county,
  telephone_number as telephone,
  condition,
  measure_id,
  measure_name,
  score,
  sample,
  footnote,
  start_date,
  end_date
from {{ source('cms', 'raw_timely_effective_care') }}
