#!/usr/bin/env sh
# Uploads dist/ to S3 and invalidates CloudFront.
#   ZIGGLES_BUCKET=my-bucket ZIGGLES_DISTRIBUTION_ID=E123ABC sh deploy/deploy.sh
# Requires the AWS CLI, authenticated with permission to write the bucket and create invalidations.
set -eu

: "${ZIGGLES_BUCKET:?Set ZIGGLES_BUCKET to the S3 bucket name}"
: "${ZIGGLES_DISTRIBUTION_ID:?Set ZIGGLES_DISTRIBUTION_ID to the CloudFront distribution id}"

cd "$(dirname "$0")/.."
test -d dist || { echo "dist/ is missing: run 'bun run build' first" >&2; exit 1; }

# Fingerprinted assets (file names change with their content): cache for a year.
aws s3 sync dist/_astro "s3://$ZIGGLES_BUCKET/_astro" --delete \
  --cache-control "public, max-age=31536000, immutable"

# Everything else (HTML, sitemap, icons, robots.txt, llms.txt): always revalidate.
aws s3 sync dist "s3://$ZIGGLES_BUCKET" --delete --exclude "_astro/*" \
  --cache-control "public, max-age=0, must-revalidate"

aws cloudfront create-invalidation --distribution-id "$ZIGGLES_DISTRIBUTION_ID" --paths "/*" >/dev/null
echo "Deployed to s3://$ZIGGLES_BUCKET and invalidated $ZIGGLES_DISTRIBUTION_ID"
