#!/bin/sh

echo "Checking for harvest_config.yaml..."

# Supprimer un lien mort si besoin
if [ -L harvest_config.yaml ] || [ ! -f harvest_config.yaml ]; then
  echo "No harvest_config.yaml found. Falling back to sample config..."
  cp harvest_config.sample.yaml harvest_config.yaml
fi

echo "harvest_config.yaml ready. Running harvester..."

python -m cde_harvester --file harvest_config.yaml
