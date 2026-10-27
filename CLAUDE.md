# Working on this project

Read README.md for how it fits together and ROADMAP.md for what's next. Item 0 there, the Cloudflare move, is pending on the owner.

## Layout
- `~/sichos/app` is this repo (public for now): code, catalog scripts, deploy workflows.
- `~/sichos/notes` is `sichos-notes` (private): catalogs, the owner's notes, the tagger Action.

## Commands
- `npm run dev -- --port 5199`: dev server against `../notes` on disk (no token needed).
- `npm test` and `npm run check` must both pass before committing.
- `npm run catalog*`: rebuild catalogs (see README). They're cached, so reruns are free.

## Conventions that bite
- **SvelteKit 3:** import from `#lib/...` *with the file extension* (`#lib/store.svelte.ts`, `#lib/format.ts`). Use `$app/env`, not `$app/environment`. The service worker uses `$app/manifest`.
- **Hash routing** (`router.type: 'hash'`): build every link with `resolve('/s/[id]', { id })` from `$app/paths`. Don't add page options such as `ssr` (the build rejects them). Match the current route by `page.route.id`.
- **Scripts run on Node's built-in TypeScript**, so relative imports in anything a script touches (including `src/lib/catalog/*`) need `.ts` extensions.
- **Hebrew:** JavaScript's `\b` doesn't treat Hebrew letters as word characters. `normalize()` in `src/lib/hebrew.ts` folds nikud, quote marks (including ” and ״) and final letters. There are two `hebrewNumeral`s: `hebrew.ts` formats a number, and `catalog/mafteiach.ts` parses one (including thousands, `ג'תתקמ"ג`).
- **Catalog IDs are permanent;** notes are keyed by them.
- **Be a polite crawler:** go through `scripts/fetch-cached.ts`, one request at a time, cached.

## Working with the notes repo
- **The live app commits to it** whenever the owner saves, so `git pull --rebase` before pushing.
- **Test notes:** UI tests create real files in `../notes/ls`, `tm/`, `ig/` and so on. Delete them before committing (`git status` in `../notes`). In zsh, `rm a/*.md b/*.md` aborts entirely if one glob matches nothing; use `find … -delete`.

## Checking the UI
`playwright-core` with the system Chrome (`chromium.launch({ channel: 'chrome' })`) against the dev server. Screenshot light, dark (`colorScheme: 'dark'`) and phone (390×844) sizes. Watch for bidi order in mixed Hebrew/English lines.
