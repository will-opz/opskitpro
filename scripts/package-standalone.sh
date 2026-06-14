#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/.deploy/opskitpro"
ARCHIVE="$ROOT_DIR/.deploy/opskitpro-standalone.tar.gz"

cd "$ROOT_DIR"

npm run build

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/.next"

cp -R .next/standalone/. "$OUTPUT_DIR/"
cp -R .next/static "$OUTPUT_DIR/.next/static"
cp -R public "$OUTPUT_DIR/public"

tar -czf "$ARCHIVE" -C "$OUTPUT_DIR" .

echo "Packaged standalone server: $ARCHIVE"
