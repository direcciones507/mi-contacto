#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts
npm test 2>&1 | tee artifacts/tests.log
node scripts/native-validation.mjs --run --pg-bin "${MC_PG_BIN:?Native PostgreSQL bin required}" --evidence "$PWD/artifacts/native" 2>&1 | tee artifacts/native.log
npm run test:browser 2>&1 | tee artifacts/browser.log
npm audit --omit=dev --json > artifacts/audit.json
