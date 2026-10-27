// Parses a mafteiach.app "Likkutei Sichos by volume" page into catalog entries.
import { parse, type HTMLElement } from 'node-html-parser';
import type { Sicha } from './types';

const MAFTEIACH = 'https://mafteiach.app';

const HEB_NUM: Record<string, number> = {
	א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10,
	כ: 20, ל: 30, מ: 40, נ: 50, ס: 60, ע: 70, פ: 80, צ: 90, ק: 100
};

/** "יא" → 11, "טו" → 15. Returns undefined for anything that isn't a plain Hebrew numeral. */
export function hebrewNumeral(s: string): number | undefined {
	const letters = s.replace(/["'״׳]/g, '');
	if (!letters || [...letters].some((c) => !(c in HEB_NUM))) return undefined;
	return [...letters].reduce((n, c) => n + HEB_NUM[c], 0);
}

// Volume indexes and the list of printings: listed like sichos on mafteiach, but not something you learn.
const META_HEADINGS = ['מפתחות', 'רשימת הדפוסים'];

const text = (el: HTMLElement | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

/**
 * Button labels look like `ח"א ע' 4 (נח)` or `חט"ו ע' 34 (נח א)`.
 * The parenthetical is the sicha's own label; a trailing single numeral is its index within the parsha.
 * Additions are flipped: `הוספות - כסלו (חט"ו ע' 506)`.
 */
export function parseLabel(label: string): { page?: number; title: string; index?: number; kind: Sicha['kind'] } {
	const page = Number(label.match(/ע['׳]\s*(\d+)/)?.[1]) || undefined;
	const paren = label.match(/\(([^)]*)\)\s*$/)?.[1].trim();
	if (label.startsWith('הוספות')) {
		const title = label.replace(/\([^)]*\)\s*$/, '').replace(/^הוספות\s*-\s*/, '').trim();
		return { page, title, index: undefined, kind: 'hosafa' };
	}
	const title = paren ?? label;
	const last = title.split(' ').at(-1)!;
	const index = title.includes(' ') && last.length <= 2 ? hebrewNumeral(last) : undefined;
	return { page, title, index, kind: 'sicha' };
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
				kind: isMeta ? 'meta' : kind,
				groups: [groupLabel],
				summary: parseSummary(content?.querySelector('.trix-content'), title),
				links
			});
		}
	}
	return [...byId.values()];
}
