#!/bin/sh

echo "Checking for harvest_config.yaml..."

# If no harvest_config.yaml exists, fall back to the sample version
if [ ! -f harvest_config.yaml ]; then
  echo "No harvest_config.yaml found, using default sample config..."
  cp harvest_config.sample.yaml harvest_config.yaml
else
  echo "harvest_config.yaml found, using it."
fi

# Now launch the harvester
python -m cde_harvester
