# Screen engineer brief — Mansa AI, stage 1

You are building finished, production-quality screens on an existing foundation. Several engineers work in this same folder at the same time, each on different page files.

## Read first (in this order)
1. `/home/claude/mansa-ai/app/CONVENTIONS.md` — binding rules for code, colour, layout, data and Slovenian copy.
2. `/home/claude/mansa-ai/docs/SPEC.md` — sections 1–5 (what the product is, roles, journeys, screens). Section 5 is the screen list.
3. `/home/claude/mansa-ai/docs/reference-chatbase-agent-screen.png` — layout reference (structure only, not the look). Open it with the Read tool.
4. `src/pages/Gallery.tsx` and the screenshots in `/home/claude/mansa-ai/shots/foundation/ui-1440-light-0*.png` — every primitive you can use.
5. `src/data/api.ts` (function list and types) and `src/data/labels.ts`, `src/data/format.ts`.

## Quality bar
- The owner's top priority is the interface. It must feel like a market-leading product: calm, dense enough to be useful, nothing decorative. Every screen must explain itself: a first-time small-business owner (hairdresser, dentist) understands what the screen is for and what to do next without help.
- Summary before detail. State is visible at a glance (StatusPill, not only text). One primary action per view.
- Real content only. No lorem ipsum, no placeholder boxes, no "coming soon" sections. If something cannot work in stage 1 (external calls), the control still works against the simulated API and shows the API's honest result message.
- Interface language: Slovenian, formal address, correct č š ž. Follow the fixed vocabulary in CONVENTIONS.md.
- No invented claims: no testimonials, customer logos, customer counts, savings percentages, awards, certifications, "GDPR compliant", "data stays in the EU", uptime numbers or guarantees. No statements about what happens to data beyond what the screen itself does. Prices and limits come only from `api.listPlans()` / the account data, never typed into a page.
- People in sample data are fictional; do not add real names.

## Hard technical rules (the preview host enforces them)
- Edit ONLY your assigned page files (and you may add new files inside a subfolder you create next to them, e.g. `src/pages/app/knowledge/…`). Do NOT edit `src/components/**`, `src/data/**`, `src/styles/**`, `src/routes.tsx`, configs or other engineers' pages. If a primitive or API function is missing or buggy, work around it locally and REPORT it.
- Everything in CONVENTIONS.md "Forbidden" applies. No colour literals, no default Tailwind palette, no `dark:` variants, no `100vh`/`h-screen`.
- Must work at 400px wide with no horizontal page scroll, and in dark theme.
- Strict TypeScript; unused imports/variables are errors.

## How to verify (other engineers are editing the same project, so use your OWN output folder and port)
Your prompt gives you a letter (A–E). Use port 4180 + your index (A=4181, B=4182, C=4183, D=4184, E=4185) and folder `/tmp/mansa-dist-<letter>`.
```
cd /home/claude/mansa-ai/app
npx tsc --noEmit 2>&1 | grep -E "src/pages/<your paths>" ; echo "tsc filtered exit: done"     # only errors in YOUR files matter while others are mid-edit
npx vite build --outDir /tmp/mansa-dist-<letter> --emptyOutDir                                  # if it fails in someone else's file, wait 30s and retry
npx vite preview --outDir /tmp/mansa-dist-<letter> --port <port> &                               # background; kill it when done
SHOTS_BASE=http://localhost:<port> SHOTS_OUT=/home/claude/mansa-ai/shots/<letter> SHOTS_ROUTES=<comma list of your hash routes> node scripts/shots.mjs
```
`scripts/shots.mjs` logs in and captures each route at 1440×900 and 400×800, light and dark, and prints an overflow report. For states it does not reach (open dialogs, tabs, a filled form, error states, logged-out pages, wizard steps) write your own small Playwright script next to it under `/tmp` (same Chromium: `find /opt/pw-browsers -name chrome -type f | head -1`; never run `playwright install`).
LOOK at your screenshots with the Read tool — at least every screen at 1440 light and 400 light, and two in dark — and fix what is visibly wrong before you report. Then stop your preview server.

## Report back (concise)
- Files you created/changed.
- For each screen: what it shows and which states you verified by screenshot.
- Missing or buggy shared primitives / API functions you worked around (file + what).
- Anything you could not verify.
- The last lines of your final build and the overflow report lines for your routes.
