import { describe, expect, it } from 'vitest';
import { hebrewNumeral, normalize } from './hebrew';

describe('normalize', () => {
	it('strips niqqud and quotes and folds finals', () => {
		expect(normalize('שָׁלוֹם')).toBe('שלומ');
		expect(normalize('חה"ש')).toBe('חהש');
		expect(normalize('Ahavas Yisroel')).toBe('ahavas yisroel');
	});
});

describe('hebrewNumeral', () => {
	it('formats with geresh and gershayim', () => {
		expect(hebrewNumeral(1)).toBe("א'");
		expect(hebrewNumeral(15)).toBe('ט"ו');
		expect(hebrewNumeral(16)).toBe('ט"ז');
		expect(hebrewNumeral(39)).toBe('ל"ט');
		expect(hebrewNumeral(115)).toBe('קט"ו');
	});
});
