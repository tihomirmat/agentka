# Fix brief — Mansa AI, stage 1, after review 1

An independent reviewer went through every screen (`/home/claude/mansa-ai/docs/REVIEW-1.md`). The shared layer has already been fixed and now offers new shared primitives. You own ONE area of page files. Fix every finding for your area and migrate your pages to the shared primitives. Several engineers work in this folder at the same time, each on a different area.

## Read first
1. `/home/claude/mansa-ai/docs/REVIEW-1.md` — the whole "Must fix" table, the "Should fix" section for YOUR area, the "Later" items for your area, section 4 "Slovenian corrections" and the vocabulary corrections (apply every one whose file is yours), section 5 "Consolidate into shared components".
2. `/home/claude/mansa-ai/app/CONVENTIONS.md` — it changed. Read all of it, especially the results rule (inline `Notice` vs. toast — never both), the status-explanation rule, the date rule, and the table "Migration notes for page engineers".
3. `/home/claude/mansa-ai/docs/SCREEN-BRIEF.md` — the quality bar and hard rules still apply.
4. The Gallery source `src/pages/Gallery.tsx` + `src/pages/gallery/*` for how the new primitives are used.

## What to do
- Fix every **must** and **should** finding assigned to your area (also the page half of findings marked "X + Shared"). Do the **later** ones for your area unless one needs a product decision — then leave it and report it.
- Apply every Slovenian and vocabulary correction that lives in your files, and proofread the rest of your screens' copy to the same standard (the reviewer listed examples, not everything).
- Migrate to the shared primitives per the migration table and DELETE the local duplicates you replaced (no dead files). After you finish, your area must not contain its own notice/callout, save bar, draft hook, search field, segmented control, time input, choice card, typed-confirm dialog, fact list, plan card or checklist rows.
- Follow the results rule everywhere in your area: a simulated external action shows ONE inline `Notice`; a change the user can see on the page shows a toast; never both for the same result.
- Remove page-level copies of states the shell strip already covers (see CONVENTIONS).
- Do not regress what already worked. Do not redesign beyond the findings.

## Rules
- Edit ONLY files in your area (listed in your prompt). Do NOT edit `src/components/**`, `src/data/**`, `src/styles/**`, `src/lib/**`, `src/routes.tsx`, `scripts/**`, configs, or other areas. If a shared primitive cannot do what a finding needs, work around it locally and report it.
- All hard rules from SCREEN-BRIEF.md and CONVENTIONS.md (tokens only, no forbidden APIs, 400px, dark theme, strict TS).

## Verify (your own output folder and port — others are building at the same time)
Port 4190 + your index (A=4191, B=4192, C=4193, D=4194, E=4195), folder `/tmp/mansa-fix-<letter>`.
```
cd /home/claude/mansa-ai/app
npx tsc --noEmit 2>&1 | grep -E "<your paths>"            # only errors in YOUR files matter while others are mid-edit
npx vite build --outDir /tmp/mansa-fix-<letter> --emptyOutDir     # if it fails in someone else's file, wait 30 s and retry
npx vite preview --outDir /tmp/mansa-fix-<letter> --port <port> &
SWEEP_BASE=http://localhost:<port> SWEEP_OUT=/home/claude/mansa-ai/shots/fix-<letter> SWEEP_COMBOS=1440-light,400-light,1440-dark node scripts/sweep.mjs
```
`scripts/sweep.mjs` screenshots EVERY screen (logged out, fresh account through the wizard, sample customer, admin) and fails on overflow, a scrolling app frame, console errors or external requests. Read its header for options. For the states a finding is about (dialogs, errors, a dirty form, a refused clipboard, a fresh account) write your own Playwright script under `/tmp` using `scripts/lib.mjs`.
For EVERY finding you fix, verify the fix the way the finding was observed (screenshot of that state, or a measured value), and look at the result with the Read tool. Stop your preview server when done.

## Report back (concise)
- A table: finding ID → fixed / not fixed (why) → how you verified it (file name of the screenshot or the measured value).
- Slovenian corrections applied (count) and any you disagreed with (with reason).
- Local files deleted after migration; shared primitives that could not do the job.
- Anything you could not verify.
- Last lines of your final build and the sweep summary line.
