import { describe, expect, it } from 'vitest';
import { subject } from './subject';

describe('subject', () => {
	it('agrees across spellings of a parsha', () => {
		expect(subject('חקת')).toBe(subject('חוקת'));
		expect(subject('פנחס')).toBe(subject('פינחס'));
		expect(subject('מטות מסעי')).toBe(subject('מטו"מ'));
		expect(subject(`וירא-כ' מ"ח`)).toBe('וירא');
	});

	it('agrees across names of a moed', () => {
		expect(subject('חג הסוכות')).toBe(subject('חה"ס'));
		expect(subject('שבועות')).toBe(subject('חה"ש'));
		expect(subject('ט”ו באב')).toBe(subject('ט"ו באב'));
		expect(subject('חמשה עשר באב')).toBe(subject('ט"ו באב'));
	});
});
