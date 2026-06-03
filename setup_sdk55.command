#!/bin/bash
cd "$(dirname "$0")"
ulimit -n 65536

echo "=== IndTaxPro SDK 55 Setup ==="
echo ""

echo "Step 1/3: Removing old node_modules and lockfile..."
rm -rf node_modules package-lock.json
echo "Done."
echo ""

echo "Step 2/3: Installing SDK 55 packages (takes 2-4 mins)..."
npm install --legacy-peer-deps --no-fund
if [ $? -ne 0 ]; then
  echo ""
  echo "ERROR: npm install failed. See above."
  read
  exit 1
fi
echo "Done."
echo ""

echo "Step 3/3: Expo version check..."
node -e "console.log('Expo:', require('./node_modules/expo/package.json').version)"
echo ""

echo "Starting Expo (SDK 55)..."
echo "Scan the QR code with Expo Go."
echo ""
./node_modules/.bin/expo start --clear
