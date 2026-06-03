#!/bin/bash
cd "$(dirname "$0")"

# Fix EMFILE: raise open file descriptor limit
ulimit -n 65536

if ! command -v watchman &> /dev/null; then
  echo "Note: Watchman not found. Using increased ulimit instead."
  echo "Permanent fix: brew install watchman"
  echo ""
fi

echo "Installing / updating dependencies for SDK 55..."
npm install

echo ""
echo "Starting Expo dev server (clearing cache)..."
echo "Press 'a' for Android emulator or scan QR with Expo Go"
echo ""
npx expo start --clear
