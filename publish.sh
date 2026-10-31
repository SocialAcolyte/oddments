#!/bin/bash
# Publish every @oddments package, then the oddments command. npm asks you to
# confirm each one (two-factor), in the browser or with a code from your app.
# Already-published versions are skipped, so it is safe to run again.
set -uo pipefail
cd "$(dirname "$0")"
for dir in packages/*/ cli/; do
  name=$(node -p "require('./$dir/package.json').name"); version=$(node -p "require('./$dir/package.json').version")
  if npm view "$name@$version" version >/dev/null 2>&1; then echo "skip $name@$version (already out)"; continue; fi
  echo; echo "==> $name@$version"
  (cd "$dir" && npm publish --access public) || { echo "stopped at $name"; exit 1; }
done
echo; echo "All published. Try: npx oddments"
