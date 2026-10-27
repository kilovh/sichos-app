# sichos-app

A personal checklist and notebook for the Lubavitcher Rebbe's sichos: Likkutei Sichos sicha by sicha, plus favorites from Toras Menachem and Igros.

This repo holds only code. Notes and the catalog live in a separate **private** repo (`sichos-notes`), which the app reads and writes through the GitHub API with a fine-grained token stored on each device. The site shows nothing but a "connect" screen without that token, and asks search engines not to index it.

- **Hosting:** GitHub Pages, via `.github/workflows/deploy.yml` on every push to `main`.
- **Offline:** an installable PWA. Notes are cached in IndexedDB, and edits queue up and sync when back online. Concurrent edits from two devices are merged.
- **Search:** client-side (MiniSearch), with Hebrew normalization (nikud, final letters, prefixes ו/ה/ב/כ/ל/מ/ש).

## Development

```sh
npm install
npm run dev        # uses ../notes on disk instead of GitHub, so no token is needed
npm test
npm run check
```

## Catalogs

Built once by scripts that fetch politely (one request at a time, cached in `.cache/` so nothing is fetched twice; `-- --refresh` to refetch):

```sh
npm run catalog:chabadlibrary  # maps LS volumes 30–39 to their full-text pages on chabadlibrary.org
npm run catalog                # ../notes/catalog/ls.json — Likkutei Sichos, from mafteiach.app (+ the map above)
npm run catalog:tm             # ../notes/catalog/tm.json — the Toras Menachem calendar, from mafteiach.app
```

Problems found while parsing (duplicate links, missing summaries, unmatched pages) are listed in `.cache/catalog-problems.txt`.

Catalog data courtesy of [mafteiach.app](https://mafteiach.app); full-text links to [chabadlibrary.org](https://chabadlibrary.org).
