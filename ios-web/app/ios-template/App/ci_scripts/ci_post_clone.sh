#!/bin/sh
# Xcode Cloud runs this right after cloning, before it resolves Swift packages and builds.
# The web bundle (app/www/app.js, index.html), the synced ios/App/App/public folder and app/node_modules (the Capacitor plugins'
# Swift packages live there) are all gitignored, so build them here the same way `npm run sync` does on a Mac.
set -eu
cd "$CI_PRIMARY_REPOSITORY_PATH"
# The build id in the app counts commits; a shallow clone would undercount.
git fetch --unshallow --quiet 2>/dev/null || true
command -v node >/dev/null || brew install node
cd app
npm ci --no-audit --no-fund
npm run sync
grep -o 'BUILD_ID="[^"]*"' ios/App/App/public/app.js | head -1
# What to Test: Xcode Cloud attaches TestFlight/WhatToTest.<locale>.txt from beside ci_scripts to the build, so the notes reach both
# groups through the post-actions with no Mac step.
mkdir -p ios/App/TestFlight
node ../tools/whattotest.mjs > ios/App/TestFlight/WhatToTest.en-US.txt
cat ios/App/TestFlight/WhatToTest.en-US.txt
