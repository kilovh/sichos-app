// Builds the Likkutei Sichos catalog (../notes/catalog/ls.json) from mafteiach.app.
//   node scripts/build-catalog.ts            use cached pages, fetch only what's missing
//   node scripts/build-catalog.ts --refresh  refetch everything
// Raw pages are cached in .cache/mafteiach so the site is hit at most once per volume.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseVolumePage } from '../src/lib/catalog/mafteiach.ts';
import type { Sicha } from '../src/lib/catalog/types.ts';

const VOLUMES = 39;
const DELAY_MS = 2000;
const CACHE = '.cache/mafteiach';
// The catalog lives in the private notes repo, next to this one.
const OUT = process.env.CATALOG_OUT ?? '../notes/catalog/ls.json';
const refresh = process.argv.includes('--refresh');

async function volumeHtml(vol: number): Promise<string> {
	const file = `${CACHE}/vol-${vol}.html`;
	if (!refresh && existsSync(file)) return readFileSync(file, 'utf8');
	await new Promise((r) => setTimeout(r, DELAY_MS));
	const res = await fetch(`https://mafteiach.app/likkutei_sichos/by_volume/${vol}`, {
		headers: { 'User-Agent': 'sichos-tracker (personal study log; credits mafteiach.app)' }
	});
	if (!res.ok) throw new Error(`volume ${vol}: HTTP ${res.status}`);
	const html = await res.text();
	writeFileSync(file, html);
	return html;
}

function validate(all: Sicha[]): string[] {
	const problems: string[] = [];
	const seen = new Map<string, string>();
	for (const s of all) {
		if (!s.links.pdf) problems.push(`${s.id}: no PDF link`);
		if (!s.summary && s.kind === 'sicha') problems.push(`${s.id}: no summary`);
		for (const [field, value] of [['pdf', s.links.pdf], ['summary', s.summary]] as const) {
			if (!value) continue;
			const key = `${field}:${value}`;
			const other = seen.get(key);
			if (other) problems.push(`${s.id}: same ${field} as ${other}`);
			else seen.set(key, s.id);
		}
	}
	return problems;
}

mkdirSync(CACHE, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });

const all: Sicha[] = [];
for (let vol = 1; vol <= VOLUMES; vol++) {
	const sichos = parseVolumePage(await volumeHtml(vol), vol);
	const hosafos = sichos.filter((s) => s.kind === 'hosafa').length;
	console.log(`vol ${String(vol).padStart(2)}: ${sichos.length - hosafos} sichos, ${hosafos} additions`);
	all.push(...sichos);
}

// Full-text links, from scripts/build-chabadlibrary.ts (run that first; without it there are none).
const CL_PAGES = '.cache/chabadlibrary-ls.json';
const clPages: Record<string, number> = existsSync(CL_PAGES) ? JSON.parse(readFileSync(CL_PAGES, 'utf8')) : {};
let linked = 0;
for (const s of all) {
	const node = s.page && clPages[`${s.vol}:${s.page}`];
	if (node) {
		s.links.chabadlibrary = `https://chabadlibrary.org/books/${node}`;
		linked++;
	}
}
const clVolumes = new Set(Object.keys(clPages).map((k) => Number(k.split(':')[0])));
const unmatched = all.filter((s) => s.kind !== 'meta' && clVolumes.has(s.vol) && !s.links.chabadlibrary);

writeFileSync(OUT, JSON.stringify(all, null, '\t') + '\n');
const problems = [...validate(all), ...unmatched.map((s) => `${s.id}: no Chabad Library page ${s.page}`)];
writeFileSync('.cache/catalog-problems.txt', problems.join('\n') + '\n');
console.log(`\n${all.length} entries → ${OUT}`);
console.log(`${linked} linked to Chabad Library (volumes ${[...clVolumes].sort((a, b) => a - b).join(', ') || 'none'})`);
console.log(`${problems.length} problems for review → .cache/catalog-problems.txt`);
