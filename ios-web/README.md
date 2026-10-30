# App template

A starting point for apps that Claude cloud sessions build and ship hands-off, the way Lodebreaker ships: you say what to change, and the change reaches the web, your phone through TestFlight, and your testers, with nobody touching anything.

- One-file web app (`src/` → one page, no dependencies), smoke tests on headless Chromium, a Capacitor 8 iOS shell.
- Cloudflare Pages deploys the web from `main`; Xcode Cloud builds the `testflight` branch into TestFlight for an internal and an external group.
- The `/ship` skill and `tools/ship-status.mjs` let a cloud session ship and verify everything itself; a Mac session is only the fallback.

**Start here: [PLAYBOOK.md](PLAYBOOK.md).** New app: create an empty repo, open a Claude cloud session on it and say "Start this app from nolanreed18/app-template's ios-web track"; Claude copies this folder to the new repo's root and runs `node tools/init.mjs --name "My App" --id com.yourname.myapp --web https://myapp.pages.dev`, which fills the placeholders and replaces this README.
