// Parses a mafteiach.app "Likkutei Sichos by volume" page into catalog entries.
import { parse, type HTMLElement } from 'node-html-parser';
import type { Sicha } from './types';

const MAFTEIACH = 'https://mafteiach.app';

const HEB_NUM: Record<string, number> = {
	א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10,
	כ: 20, ל: 30, מ: 40, נ: 50, ס: 60, ע: 70, פ: 80, צ: 90, ק: 100, ר: 200, ש: 300, ת: 400,
	ך: 20, ם: 40, ן: 50, ף: 80, ץ: 90
};

const sum = (letters: string) =>
	letters && [...letters].every((c) => c in HEB_NUM) ? [...letters].reduce((n, c) => n + HEB_NUM[c], 0) : undefined;

/**
 * "יא" → 11, `ל"ט` → 39, `תתקמ"ג` → 943, and thousands marked by a geresh: `ג'תתקמ"ג` → 3943.
 * Past ten thousand the mark is י׳: `י'קצ` → 10190. A lone letter with a geresh (`א'`) is just 1. Returns undefined for anything that isn't a Hebrew numeral.
 */
export function hebrewNumeral(s: string): number | undefined {
	const t = s.trim().replace(/["״”]/g, '');
	const thousands = t.match(/^([א-ת]{1,2})['׳’](.+)$/);
	if (thousands) {
		const [k, rest] = [sum(thousands[1]), sum(thousands[2].replace(/['׳’]/g, ''))];
		return k === undefined || rest === undefined ? undefined : k * 1000 + rest;
	}
	return sum(t.replace(/['׳’]/g, ''));
}

// Volume indexes and the list of printings: listed like sichos on mafteiach, but not something you learn.
const META_HEADINGS = ['מפתחות', 'רשימת הדפוסים'];

const text = (el: HTMLElement | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

// "הוספות", "הוספה", and one misspelt "הופסות". (No \b: JavaScript doesn't count Hebrew as word characters.)
const ADDITION = /^(הוספות|הוספה|הופסות)(?=[\s'"-]|$)/;

/**
 * Button labels look like `ח"א ע' 4 (נח)` or `חט"ו ע' 34 (נח א)` — citation, then the sicha's own label
 * in parentheses (which may itself contain parentheses: `((ערב) חה"ש)`), sometimes followed by a year
 * in brackets: `חכ"ג ע' 17 (חה"ש א) [תשמ"א]`. A trailing single numeral is the index within the parsha.
 * Additions are flipped: `הוספות - כסלו (חט"ו ע' 506)`.
 */
export function parseLabel(label: string): { page?: number; title: string; index?: number; kind: Sicha['kind'] } {
	const page = Number(label.match(/ע['׳]\s*(\d+)/)?.[1]) || undefined;
	const year = label.match(/\[([^\]]+)\]\s*$/)?.[1];
	const rest = label.replace(/\s*\[[^\]]+\]\s*$/, '');
	const withYear = (t: string) => (year ? `${t} [${year}]` : t);

	const flipped = rest.match(/^(.*?)\s*\(([^()]*ע['׳]\s*\d+[^()]*)\)\s*$/);
	if (flipped && flipped[1]) {
		const isAddition = ADDITION.test(flipped[1]);
		const title = flipped[1].replace(/^(הוספות|הוספה|הופסות)\s*-\s*/, '').trim();
		// The page is the citation's, not a page mentioned in the title ("הוספה למכתב בע' 564").
		const own = Number(flipped[2].match(/ע['׳]\s*(\d+)/)?.[1]) || page;
		return { page: own, title: withYear(title), index: undefined, kind: isAddition ? 'hosafa' : 'sicha' };
	}

	const open = rest.indexOf('(');
	const title = open >= 0 ? rest.slice(open + 1, rest.lastIndexOf(')')).trim() : rest;
	return { page, title: withYear(title), index: sichaIndex(title), kind: 'sicha' };
}

/**
 * The sicha's number within its parsha: a lone letter after the name — `נח ב`, `עקב א - כ"ף אב`,
 * `פנחס א - תשמ״א`. Only a single letter counts, so a trailing word like `אב` (the month) isn't read as 3.
 */
export function sichaIndex(title: string): number | undefined {
	const name = title.split(/\s+-\s+/)[0].trim();
	const last = name.split(/\s+/).at(-1)!;
	return name.includes(' ') && last.length === 1 ? hebrewNumeral(last) : undefined;
}

/**
 * Summaries are Trix rich text. Sometimes one block covers neighbouring sichos under `<h1>` headings
 * (Mikeitz + Chanukah); then each sicha gets only its own section.
 */
export function parseSummary(trix: HTMLElement | null | undefined, title: string): string | undefined {
	if (!trix) return undefined;
	const sections: { heading?: string; text: string }[] = [];
	for (const node of trix.childNodes) {
		const t = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
		if (!t) continue;
		if ((node as HTMLElement).tagName === 'H1') sections.push({ heading: t, text: '' });
		else if (sections.length) sections[sections.length - 1].text = `${sections.at(-1)!.text} ${t}`.trim();
		else sections.push({ text: t });
	}
	const own = sections.find((s) => s.heading === title);
	const summary = own
		? own.text
		: sections.map((s) => (s.heading ? `${s.heading}: ${s.text}` : s.text)).join('\n');
	return summary && !summary.startsWith('ראה קיצור') ? summary : undefined;
}

export function parseVolumePage(html: string, vol: number): Sicha[] {
	const root = parse(html);
	const byId = new Map<string, Sicha>();

	for (const group of root.querySelectorAll('#parshiyos > .parsha')) {
		const button = group.querySelector('.parsha-button');
		button?.querySelector('span')?.remove();
		const groupLabel = text(button);
		const isMeta = META_HEADINGS.includes(groupLabel);
		const isAdditions = ADDITION.test(groupLabel);

		for (const btn of group.querySelectorAll('.likkut-sicha-button')) {
			const domId = btn.id.replace(/__button$/, '');
			const content = root.querySelector(`#${domId}__content`);
			const { page, title, index, kind } = parseLabel(text(btn));
			// mafteiach's DOM id carries a per-volume number that stays unique even when two additions share a page.
			const id = `ls-${vol}-${domId.match(/_(\d+)$/)?.[1] ?? page}`;

			const links: Sicha['links'] = {};
			for (const a of content?.querySelectorAll('a') ?? []) {
				const href = a.getAttribute('href');
				if (!href) continue;
				const label = text(a);
				if (label === 'שיחה') links.pdf ??= href;
				else if (label === 'מתורגם') links.translation ??= href.trim().split(/\s+/)[0];
				else if (label === 'קיצור') links.mafteiach = MAFTEIACH + href;
			}

			const existing = byId.get(id);
			if (existing) {
				// The same sicha is listed under more than one heading (e.g. Mikeitz and Chanukah).
				if (!existing.groups.includes(groupLabel)) existing.groups.push(groupLabel);
				continue;
			}
			byId.set(id, {
				id,
				vol,
				page,
				title,
				index,
				kind: isMeta ? 'meta' : isAdditions ? 'hosafa' : kind,
				groups: [groupLabel],
				summary: parseSummary(content?.querySelector('.trix-content'), title),
				links
			});
		}
	}
	return [...byId.values()];
}
