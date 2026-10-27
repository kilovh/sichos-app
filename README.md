# sichos-app

A personal study log for the Lubavitcher Rebbe's teachings:

- **Likkutei Sichos**, all 39 volumes, as a checklist, sicha by sicha, with optional sub-sections.
- **Toras Menachem**: a calendar of every farbrengen and talk (5690–5752), to star favorites and take notes.
- **Igros Kodesh**: all 11,062 letters by volume and number, each linked to its full text.
- **Notes** in mixed Hebrew and English, linked in both directions with `[[ls-15-7]]`, `[[tm-5718-06-14]]` or `[[ig-3-543]]`, and tagged automatically.

Live at **https://kilovh.github.io/sichos-app/**. The move to Cloudflare Pages is pending; see [ROADMAP.md](ROADMAP.md) item 0. Future work is in [ROADMAP.md](ROADMAP.md); conventions for whoever works on this next (human or AI) are in [CLAUDE.md](CLAUDE.md).

---

## How it fits together

```
 ┌──────────── sichos-app (this repo) ────────────┐        ┌──────── sichos-notes (private) ────────┐
 │ SvelteKit static PWA, hash-routed              │  API   │ catalog/ls.json    Likkutei Sichos      │
 │ GitHub Pages ← .github/workflows/deploy.yml    │◀──────▶│ catalog/tm.json    Toras Menachem       │
 │ scripts/  build the catalogs (run by hand)     │ token  │ catalog/igros.json Igros Kodesh         │
 └────────────────────────────────────────────────┘        │ ls/ tm/ ig/        one note per entry   │
                                                            │ thoughts/ log/     free-standing notes  │
                                                            │ tags.yml + auto-tag Action (Claude)     │
                                                            └─────────────────────────────────────────┘
```

- **Code only lives here; everything else is in the private `sichos-notes` repo.** The catalogs and every note live there. The site shows only a Connect screen to anyone without a token, and it asks search engines not to index it (`noindex`) and sends no referrer when you follow a link out.
- **Each device connects once** (Settings) with a fine-grained GitHub token scoped to `sichos-notes`, permission *Contents: read and write*. The token stays in that browser's `localStorage`.
- **Sync** (`src/lib/store.svelte.ts`):
  - Every file is cached in IndexedDB, so the app opens instantly and works offline.
  - On open or refocus, the app compares blob SHAs from the git tree and fetches only changed files.
  - Every save goes into a persisted queue and becomes one commit through the GitHub contents API.
  - If the file changed elsewhere (another device, the tagger), the API rejects the write and the app does a three-way merge (`mergeNotes` in `src/lib/notes/note.ts`): lists are unioned, and if both sides edited the body, both versions are kept, marked.
- **Development** (`npm run dev`) uses the `../notes` folder on disk through a small Vite plugin (`localNotes` in `vite.config.ts`) instead of GitHub, so no token is needed.

### Notes format

One Markdown file per entry, with YAML frontmatter. Only the fields in use are written.

```markdown
---
status: learned            # or in-progress | revisit
favorite: true
learned: [2026-10-20, 2027-01-03]
sections:                  # present once "track sections" is on
  - { name: א, done: true }
  - { name: ב, done: false }
tags: [אהבת ישראל]
auto_tags: [הוראה בעבודה]  # written by the tagger; never edited by hand
auto_tags_hash: 1a2b3c4d5e6f
---

Notes, in any mix of Hebrew and English. Link to [[ls-1-4]] or [[tm-5718-06-14|Purim]].
```

| Path | Entry | ID scheme |
|---|---|---|
| `ls/ls-15-7.md` | a Likkutei Sichos sicha or addition | `ls-{vol}-{n}`, where n is mafteiach's number (the start page for sichos) |
| `tm/tm-5718-06-14.md` | a Toras Menachem entry | `tm-{mafteiach date code}`: Adar I/II are `06A`/`06B`, and a second talk that day gets a `b` suffix |
| `ig/ig-3-543.md` | an Igros letter | `ig-{vol}-{letter number}`, with a `b` suffix on the rare repeat |
| `thoughts/*.md`, `log/*.md` | free-standing notes, other sources | date-slug |

**IDs are permanent.** Notes are named by them and linked by them, so never change an ID scheme without migrating the notes repo.

### Catalogs

Each catalog is built once by a script that fetches politely: one request at a time, a pause between requests, every response cached in `.cache/`, so a rerun fetches nothing. Use `-- --refresh` to refetch.

```sh
npm run catalog:chabadlibrary  # LS vols 30–39 → full-text pages on chabadlibrary.org   (~1,100 requests, once)
npm run catalog:pls            # LS → hub pages on projectlikkuteisichos.org             (~8 requests)
npm run catalog                # → ../notes/catalog/ls.json, from mafteiach.app, merging the two maps above
npm run catalog:tm             # → ../notes/catalog/tm.json, mafteiach's calendar 5690–5752 (~44 requests)
npm run catalog:igros          # → ../notes/catalog/igros.json, chabadlibrary's 28 volumes (~30 requests)
```

Then commit and push the notes repo; the app picks the new catalog up on its next sync. Anything that didn't parse or match is listed in `.cache/catalog-problems.txt`.

| Source | Gives us | How it's matched |
|---|---|---|
| [mafteiach.app](https://mafteiach.app) | the LS checklist: volume, page, title, summary, PDF and translation links; the TM calendar | it *is* the spine |
| [chabadlibrary.org](https://chabadlibrary.org) | full text: LS vols 30–39, all of the Rebbe's Igros there | by volume + page (LS); by volume + letter number (Igros) |
| [projectlikkuteisichos.org](https://projectlikkuteisichos.org) | per-sicha hubs of shiurim, audio and summaries in seven languages | volume + subject (`subject.ts` folds spellings and abbreviations) + the sicha's position in that volume |

### Auto-tagging

In the notes repo, `.github/workflows/auto-tag.yml` runs on every push. It sends changed notes to Claude Haiku (`claude-haiku-5-5`, low effort) along with `tags.yml`, and writes 3–6 tags into `auto_tags`. New tags it proposes are appended to `tags.yml`, marked `proposed: true`. It needs the repo secret `ANTHROPIC_API_KEY` and skips quietly without it. To tag everything at once, run it by hand from the Actions tab.

### Design

The type does the work:

- **Faces:** Source Serif 4 for Latin, Frank Ruhl Libre for Hebrew. No sans-serif.
- **Color:** black on warm white and the reverse, one oxblood accent (`--red`), and gold (`--gold`) only for favorites.
- **Shapes:** square corners and hairline rules, no cards or pills. Labels are letter-spaced capitals behind a small red square (`.eyebrow`).
- **Mixed text:** each paragraph picks its own direction (`.bidi` → `unicode-bidi: plaintext`).

All the tokens are at the top of `src/app.css`.

## Development

```sh
npm install
npm run dev -- --port 5199   # http://localhost:5199, notes from ../notes
npm test                     # vitest: parsers, note format and merge, search, Hebrew helpers
npm run check                # svelte-check / TypeScript
npm run build                # static site in build/ (BASE_PATH=/sichos-app for GitHub Pages)
```

Clone `sichos-notes` next to this repo as `../notes` so that dev and the catalog scripts find it.

Every push to `main` deploys (`.github/workflows/deploy.yml`: tests, build, Pages).

## Credits

Catalog data courtesy of [mafteiach.app](https://mafteiach.app). Full texts link to [chabadlibrary.org](https://chabadlibrary.org) and shiurim to [Project Likkutei Sichos](https://projectlikkuteisichos.org). Nothing from those sites' texts is copied here; only indexes and links.
