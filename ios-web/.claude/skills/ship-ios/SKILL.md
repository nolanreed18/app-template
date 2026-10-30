---
name: ship-ios
description: Mac fallback for shipping __APP_NAME__ to TestFlight, and its one-time Xcode setup. Use when a scheduled task from the cloud session or the owner says "ship check", or the owner says ship, TestFlight, upload, iOS build or Xcode Cloud in the Mac session. Drives Xcode and the App Store Connect website with computer use when a click is needed; never hands the owner click-by-click instructions.
---

# Ship __APP_NAME__ to TestFlight (runs on the owner's Mac)

Normally nothing here runs: a cloud session pushes `testflight`, Xcode Cloud builds it, its post-actions put the build in both groups, and the cloud verifies with `tools/ship-status.mjs`. This session is the fallback when the cloud cannot reach App Store Connect, the builder when Xcode Cloud cannot build, and the hands for the one-time Xcode steps. Do every step yourself. For UI, use computer use (if it is off, say the one sentence to turn it on: Claude app → Settings → Computer use, then grant Accessibility and Screen Recording) or Claude in Chrome for the App Store Connect website.

Facts: ids in `tools/ship.config.json`; the Admin upload key at `~/.appstoreconnect/private_keys/AuthKey_<macKeyId>.p8`, never copied, printed or committed. API calls: `node tools/asc.mjs <METHOD> <path under /v1> [body.json]` from the repo root. The build id in the app (`build <count> · date · sha`) must match the commit shipped.

## Ways in
- **"ship check"** (usually a one-shot scheduled task fired by the cloud session, so the turn starts with no message from the owner): steps 1, 3, 5, 6, 7.
- **"ship"**: every step.
- **"set up Xcode"**: PLAYBOOK.md's Mac step (signing, the Xcode Cloud product and workflow, its post-actions on the App Store Connect website since the API cannot add them, Next Build Number), then `node tools/asc-ids.mjs --fix-branch --write` (a website save can clear the branch condition), commit, and steps 2 to 7 to prove it.

## Steps
1. **Sync.** `git checkout main && git pull`; note the head commit; `cd app && npm ci` if `node_modules` is missing.
2. **Trigger.** `git push origin main:testflight` (only what is on main). If testflight already points at main, start a run: `POST /ciBuildRuns` with the workflow and the branch's git reference (`GET /ciWorkflows/<id>/repository`, then `/scmRepositories/<id>/gitReferences` for `refs/heads/testflight`).
3. **Check the run.** Within two minutes `GET /ciWorkflows/<workflowId>/buildRuns` shows a run for the head of testflight. If not (Lodebreaker once got no run from a push), start one as in step 2 and run `node tools/asc-ids.mjs --fix-branch` (saving the workflow on the website can clear its branch start condition; this sets it back through the API). Post-actions are not in the API at all: if a build misses a group, look at the workflow's post-actions on the App Store Connect website and add them there. If `ci_post_clone.sh` fails, read the action's issues (`/ciBuildRuns/<id>/actions`, `/ciBuildActions/<id>/issues`), fix, commit, push main and testflight, retry. Do not hand it to the owner.
4. **Fallback build.** Only if Xcode Cloud cannot build now (quota, outage, a GitHub connection the owner has not approved): `cd app && npm run ship` (sync, archive, build id check, upload with the Admin key), and say which path was used. Then raise Xcode Cloud's Next Build Number above this upload (App Store Connect → the app → Xcode Cloud → Settings → Build Number), or the next cloud build fails with "The bundle version must be higher".
5. **Verify and fix.** `node tools/ship-status.mjs <sha> --wait --fix`: VALID, in both groups, submitted for Beta App Review, testable, and the web build. A Mac upload has no Xcode Cloud run, so ship-status cannot find it: add that build to both groups (`POST /betaGroups/<id>/relationships/builds`) and submit it (`POST /betaAppReviewSubmissions` with the build as its `build` relationship) yourself. If an API call fails, do the same on the App Store Connect website (TestFlight → the build → Groups → +) rather than stopping.
6. **Record** one dated line in `docs/HISTORY.md`: `<date>: TestFlight build <n> = build <m> (<sha>) via Xcode Cloud|the Mac, in both groups`. Commit as `Notes: ...` (no model names; end with `Co-Authored-By: Claude <noreply@anthropic.com>`), push main only.
7. **Report** in three lines: the TestFlight build number, both groups, anything that failed. The cloud reads it from this transcript.

Never: commit keys or certificates; push to testflight anything not on main; put a model name in a commit; stop with instructions for the owner when computer use can do it.

This skill is edited only from the Mac; `.claude/skills/ship/SKILL.md` only from cloud sessions. `git pull` before touching either.
