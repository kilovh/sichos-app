// Parses a mafteiach.app "by year" page (/all/by_year/5720) into a calendar of farbrengens and other talks.
// Only what the year page lists: occasion, date and a link to mafteiach's own page for the details.
import { parse } from 'node-html-parser';
import type { Farbrengen } from './types';

const MAFTEIACH = 'https://mafteiach.app';
const text = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** The page's markup is embedded as one JavaScript string literal (`let html = "…";`). */
export function extractHtml(page: string): string {
	const line = page.split('\n').find((l) => l.trimStart().startsWith('let html = '));
	if (!line) return page;
	const literal = line.trim().replace(/^let html = /, '').replace(/;\s*$/, '');
	return JSON.parse(literal.replace(/\\'/g, "'").replace(/\\`/g, '`'));
}

const MONTHS: Record<string, string> = {
	'01': 'תשרי',
	'02': 'חשון',
	'03': 'כסלו',
	'04': 'טבת',
	'05': 'שבט',
	'06': 'אדר',
	'06A': 'אדר ראשון',
	'06B': 'אדר שני',
	'07': 'ניסן',
	'08': 'אייר',
	'09': 'סיון',
	'10': 'תמוז',
	'11': 'אב',
	'12': 'אלול'
};

/** `5720-01-16b` → year 5720, month code `01`, day 16. Adar I/II are `06A`/`06B`. */
export function parseDateCode(code: string) {
	const m = code.match(/^(\d{4})-(\d{2}[AB]?)-(\d{2})/);
	return m ? { year: Number(m[1]), month: m[2], day: Number(m[3]) } : undefined;
}

export function parseYearPage(page: string): Farbrengen[] {
	const root = parse(extractHtml(page));
	const out: Farbrengen[] = [];
	for (const month of root.querySelectorAll('#months > .month')) {
		const button = month.querySelector('.month-button');
		const yearSpan = button?.querySelector('.thin-font');
		const heading = text((yearSpan?.remove(), button?.textContent)).replace(/expand_more/, '').trim();
		// Year pages head each month "תשרי <year>"; the pre-5710 page heads each year instead.
		const yearLabel = yearSpan ? text(yearSpan.textContent) : heading;

		for (const f of month.querySelectorAll('.farbrengen')) {
			const btn = f.querySelector('.farbrengen-button');
			const code = btn?.getAttribute('onclick')?.match(/'(\d{4}-[^']+)'/)?.[1];
			const date = code && parseDateCode(code);
			if (!btn || !code || !date) continue;
			const label = btn.querySelector('div');
			label?.querySelector('.material-symbols-outlined')?.remove();
			out.push({
				id: `tm-${code}`,
				year: date.year,
				yearLabel,
				month: yearSpan ? heading : (MONTHS[date.month] ?? heading),
				day: date.day,
				title: text(label?.textContent),
				url: `${MAFTEIACH}/all/${code}`
			});
		}
	}
	return out;
}
