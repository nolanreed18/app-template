# __APP_NAME__: project notes for Claude

Read this before changing anything. It is the current truth, not a diary: keep it under 40 KB (`wc -c CLAUDE.md`). Dated history (what was asked, built, measured and shipped) goes to `docs/HISTORY.md`, newest first; move a section there once it is only history. Started from the app template on __INIT_DATE__; `PLAYBOOK.md` has the one-time setup and the lessons behind the rules below.

## What this is
TODO: one paragraph. What the app is, who it is for, what makes it fun or useful. Platforms: the web (__WEB_URL__) and iOS through TestFlight, later the App Store (bundle id `__APP_ID__`).

**IP rule** (for anything inspired by an existing game or app): keep everything original, the name, art, sound, characters, text, store listing and keywords; no close imitation. Check the name for trademarks and App Store availability before the listing.

## Working with the owner
- Terse and iterative. Feedback comes in quick batches; turn each item into a concrete change, ship it, and summarise briefly.
- Wants complete, playable results, not snippets or long explanations.
- Plays mostly on the phone: touch controls, phone-width layout, safe areas and mobile audio matter more than the desktop.
- Ship a finished batch without waiting to be asked twice (the `/ship` skill) and report the build id and TestFlight build.

## Shipping pipeline (source of truth)
The owner says what to change; a cloud session (claude.ai/code on this repo) builds and ships it; it reaches the web, the owner's phone and the testers with nobody touching anything. The routine is `/ship` (`.claude/skills/ship/SKILL.md`).
1. **The loop.** The session edits, runs the smoke suite, commits, builds every target, amends the built `index.html` so the build id is clean, then `git push -u origin main && git push origin main:testflight` (always `&&`, never `;`; never push testflight anything not on main; batch, because a second testflight push within about ten minutes cancels the running Xcode Cloud build).
2. **The builders.** Cloudflare Pages deploys __WEB_URL__ from main (`node tools/build.mjs --web`, output `web`). Xcode Cloud (workflow "TestFlight": branch changes on `testflight` only, archive audience "TestFlight and App Store") builds iOS in 5 to 15 minutes; `app/ios/App/ci_scripts/ci_post_clone.sh` unshallows, installs Node if missing, runs `npm ci` and `npm run sync`, and writes What to Test from the commit log (`tools/whattotest.mjs`); post-actions put the build in the internal group and the external group "Friends" (which also submits it for Beta App Review). Post-actions are made only on the App Store Connect website or in Xcode (the API cannot read or add them), and saving the workflow there can clear its branch start condition: `node tools/asc-ids.mjs --fix-branch` checks and restores it.
3. **Verification.** The session runs `node tools/ship-status.mjs <sha> --wait --fix` in the background (exit 0 out to both groups, 1 failed, 2 still pending after 45 minutes, 3 not set up) and reads the web build id. It needs, in the cloud environment's settings: environment variables `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8` (an App Store Connect key with the App Manager role; never pasted into chat, never committed) and, under Network access Limited, Allowed domains `api.appstoreconnect.apple.com` and `__WEB_HOST__`. Ids live in `tools/ship.config.json` (`node tools/asc-ids.mjs --write` fills them); the API client is `tools/asc-lib.mjs` (`tools/asc.mjs` for one-off calls).
4. **The Mac (fallback only).** A Remote Control session on the owner's Mac (see Live build), in Bypass permissions mode, holds the Admin upload key at `~/.appstoreconnect/private_keys/` (never copied or committed) and owns `/ship-ios`: check mode is `ship-status --wait --fix`; local builds are `cd app && npm run ship`. Wake it with a one-shot `create_trigger` (`persistent_session_id` = the Mac session, `run_once_at` now + 3 minutes from a fresh `date -u`), never `send_message` (it only queues on an idle Remote Control session); wait with a background `sleep 1260` and read its transcript with `list_events` (its replies never reach the cloud chat, and `send_later` into a cloud session fails ACCESS_DENIED).
5. **Permissions.** `.claude/settings.json` allows every tool the cloud session uses; the owner picks Auto in the mode dropdown for anything else (cloud sessions ignore `bypassPermissions` in settings files). Publishing to a public shared Claude artifact always shows the owner a permission card, so ships never republish artifacts; the web build is the link to share.

**Rules.** `ship` is edited only from cloud sessions and `ship-ios` only from the Mac; pull before editing either. Never commit keys or certificates. Keep model names out of commits, trailers included: end with `Co-Authored-By: Claude <noreply@anthropic.com>`. Commit subjects are What to Test for testers: plain language; notes-only commits start with `Notes:`.

## Live build
- Web: __WEB_URL__ (every push to main; the page shows `web · date · sha`).
- TestFlight: TODO (App Store Connect name; the plain name may be taken), groups "__APP_NAME__ Internal" and "Friends", public link TODO.
- Last ship: TODO (commit, build id, TestFlight build). The ship skill keeps this line current; the log is in `docs/HISTORY.md`.
- Mac fallback session: none yet (record its session id and title, e.g. "__APP_NAME__ · ship (Mac)", once it exists).

## Layout and build
`src/` is concatenated into one inline `<script>` after `src/shell.html`, in the order of `ORDER` in `tools/build.mjs`. All files share one top-level scope, so declaration order matters and a repeated top-level function name is refused by the build.
- `src/shell.html`: markup and CSS (colour tokens on `:root`, dark only), the top bar (safe-area padded), the canvas, the build id `#ver`.
- `src/main.js`: the app. `persistKey`, `haptic`, the save (`SAVE`, `SAVE_V`, `migrate`, `load`, `save`), input, `step`, `draw` and the frame loop.
- `tools/build.mjs`: `index.html` (default; committed, the smoke tests load it), `--web` → `web/` (index.html, privacy.html from `docs/privacy.html`, `_headers`; Cloudflare runs it), `--app` → `app/www/index.html` + `app/www/app.js` (gitignored). `BUILD_ID` is `build <commit count>[+] · date · sha`, `+` on a dirty tree, `web` on Cloudflare (shallow clone).
- `app/`: the Capacitor 8 iOS shell. `www/native.js` seeds localStorage from native Preferences, defines `window.lbStore` and `window.lbHaptic`, then loads `app.js`; scripts `sync`, `add-ios`, `assets`, `ios`, `ship`. `app/ios-template/` is laid over `app/ios` by `tools/ios-setup.mjs`. See `app/README.md`.
- `tools/`: `init.mjs` (template placeholders), `ios-setup.mjs`, `assets.mjs` (icon and splash), `asc-lib.mjs`, `asc.mjs`, `asc-ids.mjs`, `ship-status.mjs`, `ship.config.json`, `whattotest.mjs`, `smoke/`.

## Key numbers (tune here)
TODO: every constant worth tuning, where it lives, its current value and why (measured, or the owner's call). Measure before tuning: a script that drives the real `step()` beats a guess.

## Saves and migrations
- Every storage key starts with `__APP_SLUG__.`; every write goes through `persistKey(k,v)` (localStorage, plus native Preferences through `window.lbStore` in the iOS shell, which mirrors every key with that prefix, so new keys need no shell change).
- The save carries `v`; `SAVE_V` in `src/main.js` is the current schema (1). Any change to what a save means bumps it and adds a step to `migrate()`, so every older save still loads. Smoke tests call `migrate()` with an old shape. Save on `visibilitychange` (iOS kills hidden apps).

## Testing
`node tools/build.mjs && node tools/smoke/run.mjs` runs every `tools/smoke/*.mjs` (today: sanity: boot, build id, frames keep coming, touch and mouse taps, save, reload, migration) and exits 1 on any failure. Run it before every ship; add a check whenever a feature lands. Every wait polls the app with `p.until(pred)`, never a fixed sleep. Playwright: `/opt/node-tools/node_modules/playwright` in cloud sessions; on a Mac `PW_CORE=$(npm root -g)/playwright-core PW_CHANNEL=chrome`. Drive the app through its globals and real input events; screenshot to check visuals. Headless cannot judge audio by ear.

## Code rules (each one cost Lodebreaker a broken build)
- Never append a `//` comment to a line that has code after the insertion point; put the comment on its own line.
- One top-level scope: a second `function name` replaces the first silently (the build refuses it); bound id ranges on both ends.
- The frame loop asks for the next frame first, so one throw in `draw()` cannot freeze the app for good; the smoke test checks frames keep coming.
- UI on phones: pad with `env(safe-area-inset-*)` and never let a later `padding` or `padding-block` rule override it; tap targets at least 30 px, counted on `pointerdown`; throttle per-frame DOM writes (about 12 Hz, `transform` rather than `width`).
- iOS shell: plugins only through `Capacitor.nativePromise(plugin, method, opts)`; `npm run sync` before any xcodebuild.
- Build after committing so the build id is clean; check it on the phone and the web after a ship.
