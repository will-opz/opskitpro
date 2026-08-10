#!/usr/bin/env bash
set -euo pipefail

SOURCE=""
EXPECTED_SHA256=""
TARGET="/var/lib/opskitpro/ipinfo/ipinfo_lite.mmdb"
ENV_FILE="/etc/opskitpro/opskitpro.env"
DRY_RUN=false

usage() {
  echo "Usage: $0 --source FILE --sha256 HASH [--target FILE] [--env-file FILE] [--dry-run]"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source) SOURCE="${2:-}"; shift 2 ;;
    --sha256) EXPECTED_SHA256="${2:-}"; shift 2 ;;
    --target) TARGET="${2:-}"; shift 2 ;;
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$SOURCE" || -z "$EXPECTED_SHA256" ]]; then
  usage >&2
  exit 2
fi

if [[ ! -f "$SOURCE" ]]; then
  echo "Source MMDB not found: $SOURCE" >&2
  exit 1
fi

if [[ ! "$EXPECTED_SHA256" =~ ^[0-9a-fA-F]{64}$ ]]; then
  echo "Expected SHA-256 must be 64 hexadecimal characters." >&2
  exit 2
fi

ACTUAL_SHA256="$(sha256sum "$SOURCE" | awk '{print $1}')"
NORMALIZED_ACTUAL="$(printf '%s' "$ACTUAL_SHA256" | tr '[:upper:]' '[:lower:]')"
NORMALIZED_EXPECTED="$(printf '%s' "$EXPECTED_SHA256" | tr '[:upper:]' '[:lower:]')"
if [[ "$NORMALIZED_ACTUAL" != "$NORMALIZED_EXPECTED" ]]; then
  echo "SHA-256 mismatch: expected $EXPECTED_SHA256, got $ACTUAL_SHA256" >&2
  exit 1
fi

TARGET_DIR="$(dirname "$TARGET")"
BACKUP="${TARGET}.previous"
TEMP_TARGET="${TARGET}.incoming"

echo "Validated source: $SOURCE"
echo "SHA-256: $ACTUAL_SHA256"
echo "Target: $TARGET"
echo "Environment: IPINFO_MMDB_PATH=$TARGET in $ENV_FILE"
echo "Backup: $BACKUP"

if [[ "$DRY_RUN" == true ]]; then
  echo "DRY RUN: would create $TARGET_DIR, atomically install the MMDB, update the environment file, and restart opskitpro."
  exit 0
fi

install -d -m 750 -o opskitpro -g opskitpro "$TARGET_DIR"
install -m 640 -o opskitpro -g opskitpro "$SOURCE" "$TEMP_TARGET"

INSTALLED_SHA256="$(sha256sum "$TEMP_TARGET" | awk '{print $1}')"
if [[ "$INSTALLED_SHA256" != "$ACTUAL_SHA256" ]]; then
  echo "Installed file checksum mismatch." >&2
  exit 1
fi

if [[ -f "$TARGET" ]]; then
  cp -p "$TARGET" "$BACKUP"
fi
mv -f "$TEMP_TARGET" "$TARGET"

if grep -q '^IPINFO_MMDB_PATH=' "$ENV_FILE"; then
  sed -i "s|^IPINFO_MMDB_PATH=.*|IPINFO_MMDB_PATH=$TARGET|" "$ENV_FILE"
else
  printf '\nIPINFO_MMDB_PATH=%s\n' "$TARGET" >> "$ENV_FILE"
fi

systemctl restart opskitpro
systemctl is-active --quiet opskitpro
echo "IPinfo Lite MMDB installed and opskitpro restarted."
