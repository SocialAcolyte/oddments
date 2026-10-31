#!/bin/bash
# Publish every @oddments package, then the oddments command. npm needs your
# two-factor confirmation for each one: type the 6-digit code from your
# authenticator app, or just press Enter to approve it in the browser instead.
# Already-published versions are skipped, so it is safe to run again.
set -uo pipefail
cd "$(dirname "$0")"
for dir in packages/*/ cli/; do
  name=$(node -p "require('./$dir/package.json').name"); version=$(node -p "require('./$dir/package.json').version")
  if npm view "$name@$version" version >/dev/null 2>&1; then echo "skip $name@$version (already out)"; continue; fi
  echo; echo "==> $name@$version"
  read -r -p "Two-factor code (or Enter to approve in the browser): " otp
  if [[ -n "$otp" ]]; then
    (cd "$dir" && npm publish --access public --otp="$otp") || { echo "stopped at $name: run ./publish.sh again"; exit 1; }
  else
    (cd "$dir" && npm publish --access public --auth-type=web) || { echo "stopped at $name: run ./publish.sh again"; exit 1; }
  fi
done
echo; echo "All published. Try: npx oddments"
