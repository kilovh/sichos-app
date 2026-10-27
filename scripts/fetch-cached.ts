// Polite fetching for the catalog scripts: one request at a time, a pause between requests,
// and every response cached on disk so a site is only ever asked once per URL (unless --refresh).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const refresh = process.argv.includes('--refresh');
const USER_AGENT = 'sichos-tracker (personal study log; credits its sources)';

export function cachedFetcher(delayMs: number) {
	let last = 0;
	return async function fetchCached(url: string, file: string): Promise<string> {
		if (!refresh && existsSync(file)) return readFileSync(file, 'utf8');
		const wait = last + delayMs - Date.now();
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		last = Date.now();
		const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
		if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
		const body = await res.text();
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, body);
		return body;
	};
}
