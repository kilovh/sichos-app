# Roadmap

Ordered by what's most useful or interesting next. Item 0 is a chore that should happen first.

---

## 0. Move hosting to Cloudflare Pages: **do this first**

**Why:** free GitHub Pages only serves public repos, and public repos are listed on the owner's GitHub profile. Cloudflare Pages is free and serves from a private repo. It's also the natural home for licensed web fonts (#9), for the small relay service that #3 and #8 need, and for an optional login wall.

**Already done:** `.github/workflows/deploy-cloudflare.yml` builds the site and publishes it to the Cloudflare Pages project **`sichos-02273f`**, i.e. **https://sichos-02273f.pages.dev**. It skips quietly until its two secrets exist.

**The owner's part (about 5 minutes):**

1. Sign up at <https://dash.cloudflare.com> (free). Copy the **Account ID** from the Workers & Pages overview.
2. **My Profile → API Tokens → Create Token → Create Custom Token**, with the single permission **Account · Cloudflare Pages · Edit**. Copy the token.
3. In a terminal, add both as repo secrets (they never need to be pasted anywhere else):
   ```sh
   gh secret set CLOUDFLARE_API_TOKEN  -R kilovh/sichos-app
   gh secret set CLOUDFLARE_ACCOUNT_ID -R kilovh/sichos-app
   ```

**The operator's part, after that:**

1. Run the workflow: `gh workflow run deploy-cloudflare.yml -R kilovh/sichos-app`, then watch it with `gh run watch`.
2. Open https://sichos-02273f.pages.dev, check that the Connect screen appears, connect with a token, and confirm notes load and a test save commits. Delete the test note afterwards.
3. Only once that works:
   - Make both repos private: `gh repo edit kilovh/sichos-app --visibility private --accept-visibility-change-consequences` (`sichos-notes` is private already).
   - Turn off GitHub Pages: `gh api -X DELETE repos/kilovh/sichos-app/pages`.
   - Delete `.github/workflows/deploy.yml` (the GitHub Pages workflow).
4. Update every mention of `kilovh.github.io/sichos-app`, including the README.

**Tell the owner:**

- **Reconnect each device.** Browsers keep the token, the offline cache and unsent edits per website. Before switching, open the old site on each device and make sure the sync badge doesn't say "unsent". Then connect once at the new address.
- **Optional login wall:** Cloudflare **Zero Trust → Access → Applications → Add → Self-hosted**, domain `sichos-02273f.pages.dev`, with a policy allowing only the owner's email. It's free for up to 50 users, and after that nobody else can even load the page.

**Rollback:** re-enable Pages with `gh api -X POST repos/kilovh/sichos-app/pages -f build_type=workflow` and make the repo public again.

---

## 1. Side-by-side reading
Open the sicha's text next to its notes in a split view with a draggable divider and a source switcher (PDF · Chabad Library · Project Likkutei Sichos). Checked on 2026-10-27: Google Drive previews (`…/preview`), chabadlibrary.org and projectlikkuteisichos.org all allow being embedded in a frame; mafteiach.app does not (`X-Frame-Options: SAMEORIGIN`), so its links stay new-tab. On a phone, the split becomes a toggle between text and notes.

## 2. "This week" on Home
The current parsha's sichos across all volumes, upcoming moadim, and **this week in past years**: Toras Menachem entries whose Hebrew date falls in the coming week. Needs a Hebrew calendar library (e.g. `@hebcal/core`) to work out the current parsha and date. Home is Likkutei Sichos-first by request, so the TM part could be one quiet line linking to Browse.

## 3. Margin notes on the PDF (à la Fermat's Library)
Notes pinned to a spot on a page and shown in the margin beside it, building on #1. Store each one in the note's frontmatter as `{ page, x, y, text }`. The obstacle is that the app can't fetch Drive PDFs itself (no CORS), so they'd need a small relay (a Cloudflare Worker, after #0) or a private copy. Render with pdf.js.

## 4. Revisit queue
Sichos marked *Revisit*, plus older notes, resurfacing on a gentle spaced schedule, with one "review" line on Home.

## 5. Igros: dates and addressees
The Igros index (`catalog/igros.json`) has volume, number and link, but not the date, city or addressee. Each letter's chabadlibrary page has them in tagged paragraphs (`igroys_bsd`, `igroys_city`, `igroys_address`). Fetching all ~11,000 at one request per second takes about 3 hours: run `scripts/build-igros.ts` extended with a detail pass, resumable thanks to `.cache/`. That makes letters searchable by recipient and date.

## 6. Theme pages
Browse by auto-tag (`tags.yml`) across Likkutei Sichos, Toras Menachem, Igros and free-standing notes, with counts. It becomes valuable once a few hundred notes exist.

## 7. A calendar of days learned
A year laid out as a grid of squares, one per day, filled on days something was learned (from the `learned:` dates). It fits the design.

## 8. Searching the Rebbe's actual words
chabadlibrary's full-text search (`/books/api/search?phrase=…&section_id=1300000000`) shown next to the app's own results. The API sends no CORS headers, so it needs the same relay as #3.

## 9. Custom fonts
The owner has licensed English fonts and some free Hebrew ones. Licensed fonts must not go in a public repo, so this waits for #0, then self-host them as `@font-face` with `font-display: swap`. Only the `--serif` and `--he` tokens in `src/app.css` change.

## 10. Ask your notes; a printed notebook
Q&A over the notes repo (it's plain Markdown, so a local model or Claude can read it directly), and a print stylesheet that typesets one volume's notes as a booklet.

---

## Smaller known issues
- **mafteiach.app:** email the maintainer to thank them and ask permission (or for a data export). Also mention the duplicated summaries and links listed in `.cache/catalog-problems.txt`.
- **Unmatched links:** 8 sichos in volumes 30–39 have no Chabad Library page match, and 15 Project Likkutei Sichos hubs have no sicha match (unusual names like "פרקי אבות כל ישראל"). Both are listed in `.cache/catalog-problems.txt`. Better aliases in `src/lib/catalog/subject.ts` would pick up most of them.
- **Toras Menachem ↔ Chabad Library:** chabadlibrary has TM volumes 1–73 (through 5733), but its farbrengen titles are free text, so matching them to mafteiach's dated entries would be fuzzy. It's possible, but needs a review pass.
- **Toras Menachem:** a few years are missing on mafteiach and may be on lahak.org, which blocks automated access.
