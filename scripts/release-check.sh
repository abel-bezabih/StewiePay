#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== StewiePay release check =="
echo "[1/7] backend typecheck"
yarn --cwd "$ROOT_DIR/apps/backend" certify:typecheck

echo "[2/7] backend lint"
yarn --cwd "$ROOT_DIR/apps/backend" lint

echo "[3/7] backend build"
yarn --cwd "$ROOT_DIR/apps/backend" build

echo "[4/7] backend smoke certification"
yarn --cwd "$ROOT_DIR/apps/backend" certify:smoke

echo "[5/7] mobile typecheck"
yarn --cwd "$ROOT_DIR/apps/mobile" certify:typecheck

echo "[6/7] mobile lint"
yarn --cwd "$ROOT_DIR/apps/mobile" lint

echo "[7/7] mobile export certification"
yarn --cwd "$ROOT_DIR/apps/mobile" certify:export

echo "== Release check passed =="
