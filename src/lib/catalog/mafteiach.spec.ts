import { describe, expect, it } from 'vitest';
import { parse } from 'node-html-parser';
import { hebrewNumeral, parseLabel, parseSummary, parseVolumePage } from './mafteiach';

describe('hebrewNumeral', () => {
	it('reads plain and punctuated numerals', () => {
		expect(hebrewNumeral('א')).toBe(1);
		expect(hebrewNumeral('טו')).toBe(15);
		expect(hebrewNumeral('ל"ט')).toBe(39);
		expect(hebrewNumeral('נח')).toBe(58);
		expect(hebrewNumeral('abc')).toBeUndefined();
	});
});

describe('parseLabel', () => {
	it('splits page, title and index', () => {
		expect(parseLabel(`חט"ו ע' 34 (נח א)`)).toEqual({ page: 34, title: 'נח א', index: 1, kind: 'sicha' });
		expect(parseLabel(`ח"א ע' 4 (נח)`)).toEqual({ page: 4, title: 'נח', index: undefined, kind: 'sicha' });
		expect(parseLabel(`ח"א ע' 15 (לך לך)`)).toEqual({ page: 15, title: 'לך לך', index: undefined, kind: 'sicha' });
	});

	it('handles the flipped label on additions', () => {
		expect(parseLabel(`הוספות - כסלו (חט"ו ע' 506)`)).toEqual({ page: 506, title: 'כסלו', index: undefined, kind: 'hosafa' });
	});
});

const sicha = (vol: number, page: number, label: string, kitzur: number) => `
	<button id="likkut_sicha_${vol}_${page}__button" class="likkut-sicha-button">ח"א ע' ${page} (${label})</button>
	<div id="likkut_sicha_${vol}_${page}__content" class="sicha-content">
		<a href="https://drive.google.com/x${page}">שיחה</a>
		<a href="https://drive.google.com/t${page} https://drive.google.com/t${page}">מתורגם</a>
		<a href="/likkutei_sichos/${kitzur}/kitzur">קיצור</a>
		<div class="trix-content"><div>סיכום ${page}</div></div>
	</div>`;

const group = (n: number, label: string, body: string) => `
	<div id="parsha_${n}" class="parsha">
		<button class="parsha-button">${label} <span>(1 שיחה)</span></button>
		<div class="sichos">${body}</div>
	</div>`;

describe('parseVolumePage', () => {
	const html = `<div id="parshiyos">
		${group(1, 'מקץ', sicha(1, 80, 'מקץ', 9))}
		${group(2, 'חנוכה', sicha(1, 80, 'מקץ', 9))}
		${group(3, 'ויגש', sicha(1, 90, 'ויגש', 10))}
	</div>`;
	const out = parseVolumePage(html, 1);

	it('merges a sicha listed under two headings', () => {
		expect(out).toHaveLength(2);
		expect(out[0].groups).toEqual(['מקץ', 'חנוכה']);
	});

	it('extracts links and summary', () => {
		expect(out[1]).toMatchObject({
			id: 'ls-1-90',
			summary: 'סיכום 90',
			links: {
				pdf: 'https://drive.google.com/x90',
				translation: 'https://drive.google.com/t90',
				mafteiach: 'https://mafteiach.app/likkutei_sichos/10/kitzur'
			}
		});
	});
});

describe('parseSummary', () => {
	const trix = parse(`<div><h1>מקץ</h1><div>הגלות נמשלה לחלום.</div><h1>חנוכה</h1><div>נרות חנוכה.</div></div>`)
		.firstChild as never;

	it('picks the section matching the sicha', () => {
		expect(parseSummary(trix, 'חנוכה')).toBe('נרות חנוכה.');
	});

	it('keeps every section, labelled, when none matches', () => {
		expect(parseSummary(trix, 'ויגש')).toBe('מקץ: הגלות נמשלה לחלום.\nחנוכה: נרות חנוכה.');
	});

	it('drops the "see kitzur" placeholder', () => {
		expect(parseSummary(parse('<div><div>ראה קיצור...</div></div>').firstChild as never, 'x')).toBeUndefined();
	});
});
