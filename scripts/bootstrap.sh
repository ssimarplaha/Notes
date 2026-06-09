#!/usr/bin/env sh
set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "node is required. Install Node 20 or newer, then rerun this script." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node 20 or newer with npm, then rerun this script." >&2
  exit 1
fi

npm install
npm run doctor
