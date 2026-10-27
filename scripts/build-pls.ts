// Maps Likkutei Sichos entries to their hub pages on projectlikkuteisichos.org — one page per sicha
// gathering the shiurim, audio, video, summaries and materials in several languages.
// The site files them under a taxonomy whose top-level terms are named `חלק טז • בא • שיחה א | chelek 16 bo sicha 1`;
// this writes .cache/pls-ls.json: { "16|בא|1": { url, count }, … } for build-catalog.ts to merge in.
//   node scripts/build-pls.ts [--refresh]
import { writeFileSync } from 'node:fs';
import { hebrewNumeral } from '../src/lib/catalog/mafteiach.ts';
import { cachedFetcher } from './fetch-cached.ts';
import { plsKey } from './pls-key.ts';

const API = 'https://projectlikkuteisichos.org/wp-json/wp/v2/topics-archive';
const fetchCached = cachedFetcher(1000);

interface Term {
	name: string;
	link: string;
	count: number;
}

const hubs: Record<string, { url: string; count: number }> = {};
const unparsed: string[] = [];

for (let page = 1; ; page++) {
	const url = `${API}?parent=0&per_page=100&page=${page}&_fields=name,link,count`;
	let terms: Term[];
	try {
		terms = JSON.parse(await fetchCached(url, `.cache/pls/terms-${page}.json`));
	} catch (e) {
		// WordPress answers past the last page with HTTP 400.
		if (String(e).includes('HTTP 400')) break;
		throw e;
	}
	if (!Array.isArray(terms) || !terms.length) break;

	for (const t of terms) {
		// Parts come in either order ("חלק טו • וירא • שיחה א" or "שיחה א • חלק טו • וירא"), with stray direction marks.
		const parts = t.name.split('|')[0].replace(/[\u200e\u200f]/g, '').split(/•|&#8226;/).map((s) => s.trim()).filter(Boolean);
		const volPart = parts.find((p) => /^חלק\s/.test(p));
		const sichaPart = parts.find((p) => /^שיחה\s/.test(p));
		const title = parts.filter((p) => p !== volPart && p !== sichaPart).join(' ');
		const v = volPart && hebrewNumeral(volPart.replace(/^חלק\s*/, ''));
		if (!v || !title) {
			unparsed.push(t.name);
			continue;
		}
		const index = sichaPart ? hebrewNumeral(sichaPart.replace(/^שיחה\s*/, '')) : undefined;
		const key = plsKey(v, title, index);
		// Some sichos have an older and a newer hub; keep the fuller one.
		if (!hubs[key] || hubs[key].count < t.count) hubs[key] = { url: t.link, count: t.count };
	}
	console.log(`page ${page}: ${terms.length} terms`);
}

writeFileSync('.cache/pls-ls.json', JSON.stringify(hubs));
console.log(`\n${Object.keys(hubs).length} sicha hubs → .cache/pls-ls.json`);
if (unparsed.length) console.log(`${unparsed.length} names not understood, e.g.: ${unparsed.slice(0, 5).join(' / ')}`);
