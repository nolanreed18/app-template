#!/bin/sh
# Mac fallback: archive and upload an iOS build to TestFlight in one step, with no Xcode sign-in (normally Xcode Cloud builds the
# testflight branch instead). Builds the web assets, syncs them into the iOS project, archives Release, checks the build id inside the
# archive, and uploads with the App Store Connect API key (an Admin key: cloud-managed distribution signing refuses lesser roles).
#   cd app && ./ship-ios.sh               archive and upload
#   cd app && ./ship-ios.sh --no-upload   archive only (the .xcarchive is left in ios/App/build)
# Commit first: the build id shown in the app is taken from git and gets a "+" on a dirty tree.
set -eu
cd "$(dirname "$0")"
cfg() { node -p "require('../tools/ship.config.json').$1"; }
KEY_ID="${ASC_KEY_ID:-$(cfg macKeyId)}"
ISSUER_ID="${ASC_ISSUER_ID:-$(cfg issuer)}"
KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$KEY_ID.p8}"
case "$KEY_ID $ISSUER_ID" in *__*) echo "Set macKeyId and issuer in tools/ship.config.json (or ASC_KEY_ID and ASC_ISSUER_ID) first: PLAYBOOK.md, API keys."; exit 1;; esac
[ -d ios/App ] || { echo "No iOS project yet: npm run add-ios (PLAYBOOK.md, iOS project)."; exit 1; }
if grep -q '__[A-Z_]*__' ios/ExportOptions.plist; then echo "Set the Apple team id in app/ios/ExportOptions.plist (teamID) first."; exit 1; fi
[ -f "$KEY_PATH" ] || { echo "API key not found at $KEY_PATH (App Store Connect → Users and Access → Integrations; it downloads once)."; exit 1; }
if [ -n "$(git status --porcelain --untracked-files=no -- ../src ../tools)" ]; then echo "Uncommitted changes in src/ or tools/: commit first so the build id is clean."; exit 1; fi

# Always sync before any xcodebuild, or the archive ships the previous build's web assets (it happened once; the build id check catches it).
echo "== sync web assets"; npm run --silent sync
ID=$(grep -o 'BUILD_ID="[^"]*"' ios/App/App/public/app.js | head -1); echo "   $ID"

cd ios/App
echo "== archive"; rm -rf build/App.xcarchive build/export
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/App.xcarchive -allowProvisioningUpdates -quiet archive
AID=$(grep -o 'BUILD_ID="[^"]*"' build/App.xcarchive/Products/Applications/App.app/public/app.js | head -1)
[ "$AID" = "$ID" ] || { echo "archive carries $AID but www has $ID"; exit 1; }
echo "   archive ok: $AID"

[ "${1:-}" = "--no-upload" ] && { echo "archive left at ios/App/build/App.xcarchive"; exit 0; }
echo "== upload to App Store Connect"
upload() { rm -rf build/export; xcodebuild -exportArchive -archivePath build/App.xcarchive -exportOptionsPlist ../ExportOptions.plist -exportPath build/export \
  -allowProvisioningUpdates -authenticationKeyPath "$KEY_PATH" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER_ID" 2>&1; }
OUT=$(upload); echo "$OUT" | grep -E 'Upload succeeded|EXPORT|error' || true
# Apple numbers builds itself; if the previous upload has not registered yet it reuses the number and refuses. Wait and retry once.
if echo "$OUT" | grep -q 'Redundant Binary Upload'; then echo "   build number collided with an upload still registering; retrying in 90 s"; sleep 90; OUT=$(upload); echo "$OUT" | grep -E 'Upload succeeded|EXPORT|error' || true; fi
echo "$OUT" | grep -q 'EXPORT SUCCEEDED' || exit 1
echo "Done. Processing takes 5 to 15 minutes; then add the build to both groups and submit it for Beta App Review (the ship-ios skill, step 5)."
echo "Xcode Cloud numbers its own builds: raise its Next Build Number above this upload before the next cloud build (PLAYBOOK.md)."
