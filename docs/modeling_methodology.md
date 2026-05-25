# Modeling Methodology

The modeling layer is hospital-level only and supports operations analytics.

Implemented modeling tasks:

- Z-score and upper-quartile outlier detection for ED throughput.
- Hospital performance clustering from ED throughput, LWBS rate, psychiatric ED time, and stroke imaging timing.
- Baseline classification for high ED delay, defined as top-quartile OP_18B performance.

Every model output is intended to guide analyst review. It does not make clinical decisions and does not predict patient outcomes.
