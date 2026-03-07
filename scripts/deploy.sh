#!/bin/bash
# deploy.sh - installs dependencies and runs Wix release if tokens are available

set -e

if [ -z "$WIX_TOKEN" ]; then
  echo "Error: WIX_TOKEN environment variable not set"
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Releasing to Wix..."
npx wix release
