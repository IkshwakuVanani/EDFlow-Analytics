# Legacy evidence contract tests explicitly opt into their historical fixture data.
# The production operations app never seeds hospitals or observations.
import os
os.environ.setdefault('EDFLOW_SEED_SAMPLE', 'true')
