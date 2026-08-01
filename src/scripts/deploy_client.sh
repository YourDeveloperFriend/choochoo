#!/bin/bash

set -e

ignoreGuard="$1"

$(dirname "$0")/guard_deploy.sh "$ignoreGuard"

# Step 1: build
npm run build-client

upload() {
  file="$1"
  newlocation="${2:-$file}"
  gzfile="${3:-"${file/min/gz}"}"

  # Step 2: gzip compress 
  gzip -c -9 "$file" > "$gzfile"

  # Step 3: deploy to s3
  aws s3 cp --content-encoding 'gzip' "$gzfile" "s3://www.choochoo.games/$newlocation"
}

upload "dist/index.min.js.map"
upload "dist/index.min.js"
upload "dist/index.min.css.map"
upload "dist/index.min.css"
upload "static/maintenance.html" index.html "dist/maintenance.gz.html"
upload "static/maintenance.jpg" maintenance.jpg "dist/maintenance.gz.jpg"

# Step 3: Invalidate the cache
aws cloudfront create-invalidation --distribution-id=E16V74AIRBU7V5 --paths "/*" > /dev/null

echo "Done deploying client."

if [ "$ignoreGuard" != "ignore-guard" ]; then
  git checkout main
fi