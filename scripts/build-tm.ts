// Builds the Toras Menachem calendar (../notes/catalog/tm.json) from mafteiach.app's year pages.
//   node scripts/build-tm.ts            use cached pages, fetch only what's missing
//   node scripts/build-tm.ts --refresh  refetch everything
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseYearPage } from '../src/lib/catalog/mafteiach-tm.ts';
import type { Farbrengen } from '../src/lib/catalog/types.ts';
import { cachedFetcher } from './fetch-cached.ts';

const OUT = process.env.TM_OUT ?? '../notes/catalog/tm.json';
const fetchCached = cachedFetcher(2000);

// mafteiach groups everything before 5710 on one page; after that, one page per year.
const PAGES = ['5690_5710', ...Array.from({ length: 5752 - 5710 + 1 }, (_, i) => String(5710 + i))];

const byId = new Map<string, Farbrengen>();
for (const p of PAGES) {
	const html = await fetchCached(`https://mafteiach.app/all/by_year/${p}`, `.cache/mafteiach-tm/${p}.html`);
	const entries = parseYearPage(html);
	// 5710 shows up on both the range page and its own page.
	for (const e of entries) byId.set(e.id, e);
	console.log(`${p.padEnd(9)} ${entries.length}`);
}

const all = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(all, null, '\t') + '\n');
console.log(`\n${all.length} entries → ${OUT}`);
