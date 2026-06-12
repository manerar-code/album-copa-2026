# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Created `public/privacidade.html` (self-contained static HTML with full LGPD privacy policy in Brazilian Portuguese) and `vercel.json` (rewrite `/privacidade` → `/privacidade.html`). Deployed to Vercel production. URL verified: `https://album-copa-2026-sable.vercel.app/privacidade` returns HTTP 200 with correct content.

## Important Decisions

- HTML file placed at project root `public/privacidade.html` (standard Expo web static assets dir) rather than `web/public/privacidade.html` — Vercel build output confirms `dist/` as output dir; the `public/` folder files are included in the deployment automatically.
- SYNC comment added to top of HTML: `<!-- SYNC: this content must match src/modules/auth/components/PrivacyPolicyModal.tsx -->`

## Learnings

- Vercel deployment via `npx vercel --prod --yes` works directly from this repo (project already linked via `.vercel/project.json`).
- The deployment was aliased to `album-copa-2026-sable.vercel.app` automatically.
- `public/` files are automatically included in the Vercel build output (`dist/`) — no separate config needed beyond the rewrite rule.

## Files / Surfaces

- `public/privacidade.html` — created
- `vercel.json` — created

## Errors / Corrections


## Ready for Next Run

