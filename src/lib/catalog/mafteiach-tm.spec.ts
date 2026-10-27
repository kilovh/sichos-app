import { describe, expect, it } from 'vitest';
import { extractHtml, parseDateCode, parseYearPage } from './mafteiach-tm';

const entry = (id: number, code: string, label: string) => `
	<div id="farbrengen_${id}" class="farbrengen">
		<button id="farbrengen_${id}_button" class="farbrengen-button" onclick="loadFarbrengenFragment(event, ${id}, false, '${code}')">
			<div><span class="material-symbols-outlined">expand_more</span> ${label}</div>
			<div><a href="/all/${code}">share</a></div>
		</button>
	</div>`;

const month = (n: number, name: string, body: string) => `
	<div id="month_${n}" class="month">
		<button class="month-button"><div>${name} <span class="thin-font">תש"כ</span></div><div><span>expand_more</span></div></button>
		<div class="farbrengens">${body}</div>
	</div>`;

const page = (inner: string) =>
	`<html><script>\n    let html = ${JSON.stringify(`<main><div id="months">${inner}</div></main>`).replace(/\//g, '\\/')};\n</script></html>`;

describe('parseDateCode', () => {
	it('reads plain, Adar and repeated-day codes', () => {
		expect(parseDateCode('5720-01-16b')).toEqual({ year: 5720, month: '01', day: 16 });
		expect(parseDateCode('5719-06B-14')).toEqual({ year: 5719, month: '06B', day: 14 });
	});
});

describe('parseYearPage', () => {
	const html = page(
		month(1, 'תשרי', entry(1, '5720-01-16', `יום ב' דחה"ס`) + entry(2, '5720-01-16b', 'ימים ראשונים דחה"ס, בעת הסעודה')) +
			month(6, 'אדר שני', entry(3, '5719-06B-14', 'פורים'))
	);

	it('decodes the embedded markup', () => {
		expect(extractHtml(html)).toContain('id="months"');
	});

	it('lists every entry with its date and link', () => {
		const out = parseYearPage(html);
		expect(out).toHaveLength(3);
		expect(out[1]).toEqual({
			id: 'tm-5720-01-16b',
			year: 5720,
			yearLabel: 'תש"כ',
			month: 'תשרי',
			day: 16,
			title: 'ימים ראשונים דחה"ס, בעת הסעודה',
			url: 'https://mafteiach.app/all/5720-01-16b'
		});
		expect(out[2]).toMatchObject({ month: 'אדר שני', day: 14, title: 'פורים' });
	});
});

describe('the pre-5710 page', () => {
	it('takes the year from the heading and the month from the date', () => {
		const html = page(`
			<div id="month_1" class="month">
				<button class="month-button"><div>תרצ"א</div></button>
				<div>${entry(9, '5691-03-19', 'י"ט כסלו')}</div>
			</div>`);
		expect(parseYearPage(html)[0]).toMatchObject({ year: 5691, yearLabel: 'תרצ"א', month: 'כסלו', day: 19 });
	});
});
