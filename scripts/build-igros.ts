// Builds the Igros Kodesh index (../notes/catalog/igros.json) from chabadlibrary.org: every letter of the
// Rebbe's Igros there, by volume and letter number, linked to its full text.
//   node scripts/build-igros.ts [--refresh]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hebrewNumeral } from '../src/lib/catalog/mafteiach.ts';
import type { Letter } from '../src/lib/catalog/types.ts';
import { cachedFetcher } from './fetch-cached.ts';

const OUT = process.env.IGROS_OUT ?? '../notes/catalog/igros.json';
const API = 'https://chabadlibrary.org/books/api/main?path=/';
const ROOT = 1200000000;
const fetchCached = cachedFetcher(1000);

interface Node {
	id: number;
	heading: string;
}

async function children(id: number): Promise<Node[] | null> {
	const body = JSON.parse(await fetchCached(API + id, `.cache/chabadlibrary/${id}.json`));
	return body.content?.type === 'children' ? body.content.data : null;
}

const letters: Letter[] = [];
const skipped = new Map<string, number>();
const seen = new Map<string, number>();

/** A volume's children are its letters, headed by number; anything else (front matter, indexes) is skipped. */
async function walk(vol: number, nodes: Node[], section?: string) {
	for (const n of nodes) {
		const heading = n.heading.replace(/\*+$/, '').trim();
		const num = hebrewNumeral(heading);
		if (num) {
			// A few letters appear as two entries under the same number (a second part, a variant).
			const base = `ig-${vol}-${num}`;
			const repeat = seen.get(base) ?? 0;
			seen.set(base, repeat + 1);
			letters.push({
				id: repeat ? `${base}${'bcdefg'[repeat - 1]}` : base,
				vol,
				num,
				numLabel: heading,
				...(section ? { section } : {}),
				url: `https://chabadlibrary.org/books/${n.id}`
			});
			continue;
		}
		// A titled group of letters (e.g. additions) — look inside once.
		const inner = section ? null : await children(n.id);
		if (inner?.some((k) => hebrewNumeral(k.heading.replace(/\*+$/, '').trim()))) await walk(vol, inner, heading);
		else skipped.set(heading, (skipped.get(heading) ?? 0) + 1);
	}
}

for (const v of (await children(ROOT)) ?? []) {
	const vol = hebrewNumeral(v.heading.replace(/^כרך\s*/, ''));
	const kids = vol && (await children(v.id));
	if (!vol || !kids) continue;
	const before = letters.length;
	await walk(vol, kids);
	const mine = letters.slice(before);
	console.log(`vol ${String(vol).padStart(2)}: ${mine.length} letters (${mine[0]?.num}–${mine.at(-1)?.num})`);
}

letters.sort((a, b) => a.vol - b.vol || a.num - b.num || a.id.localeCompare(b.id));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(letters, null, '\t') + '\n');
console.log(`\n${letters.length} letters → ${OUT}`);
console.log('skipped headings:', [...skipped].map(([h, n]) => (n > 1 ? `${h} ×${n}` : h)).join(' | '));
