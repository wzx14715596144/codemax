#!/bin/bash
set -e

echo "Installing codemax..."

if ! command -v node &> /dev/null; then
  echo "Error: Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

npm install -g codemax

echo ""
echo "✓ codemax installed!"
echo "Run 'codemax' to start"
