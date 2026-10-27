// Maps Likkutei Sichos pages to their full-text pages on chabadlibrary.org (which has volumes 30–39).
// Walks each volume's table of contents down to the page nodes, whose headings are page numbers, and
// writes .cache/chabadlibrary-ls.json: { "39:14": 1301870083, … }. build-catalog.ts merges it in.
//   node scripts/build-chabadlibrary.ts [--refresh]
import { writeFileSync } from 'node:fs';
import { hebrewNumeral } from '../src/lib/catalog/mafteiach.ts';
import { cachedFetcher } from './fetch-cached.ts';

const API = 'https://chabadlibrary.org/books/api/main?path=/';
const LS_ROOT = 1300000000;
const fetchCached = cachedFetcher(1000);

interface Node {
	id: number;
	heading: string;
}

async function children(id: number): Promise<Node[] | null> {
	const body = JSON.parse(await fetchCached(API + id, `.cache/chabadlibrary/${id}.json`));
	return body.content?.type === 'children' ? body.content.data : null;
}

const pages: Record<string, number> = {};
const duplicates: string[] = [];

// Front matter and indexes: no sichos in them, and the indexes are hundreds of nodes deep.
const SKIP = /^(דף השער|פתח דבר|תוכן|מפתח|רשימת הדפוסים)/;

/** Depth-first: a node whose children are all numbers is a run of pages. */
async function walk(vol: number, node: Node) {
	if (SKIP.test(node.heading)) return;
	const kids = await children(node.id);
	if (!kids) return;
	if (kids.length && kids.every((k) => /^\d+$/.test(k.heading))) {
		for (const k of kids) {
			const key = `${vol}:${k.heading}`;
			if (key in pages) duplicates.push(key);
			else pages[key] = k.id;
		}
		return;
	}
	for (const k of kids) await walk(vol, k);
}

for (const v of (await children(LS_ROOT)) ?? []) {
	const vol = hebrewNumeral(v.heading.replace(/^כרך\s*/, ''));
	if (!vol) continue;
	const before = Object.keys(pages).length;
	await walk(vol, v);
	console.log(`vol ${vol}: ${Object.keys(pages).length - before} pages`);
}

writeFileSync('.cache/chabadlibrary-ls.json', JSON.stringify(pages));
console.log(`\n${Object.keys(pages).length} pages → .cache/chabadlibrary-ls.json`);
if (duplicates.length) console.log(`page numbers seen twice (first kept): ${duplicates.join(' ')}`);
