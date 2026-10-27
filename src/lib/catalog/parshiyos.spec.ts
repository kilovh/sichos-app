import { describe, expect, it } from 'vitest';
import { parshiyosOf } from './parshiyos';

describe('parshiyosOf', () => {
	it('maps plain, combined and abbreviated headings', () => {
		expect(parshiyosOf('נח')).toEqual(['נח']);
		expect(parshiyosOf('ויקהל-פקודי')).toEqual(['ויקהל', 'פקודי']);
		expect(parshiyosOf('ויקה"פ')).toEqual(['ויקהל', 'פקודי']);
		expect(parshiyosOf(`וירא-כ' מ"ח`)).toEqual(['וירא']);
		expect(parshiyosOf('תבא-ח"י אלול')).toEqual(['תבוא']);
	});

	it('gives nothing for moadim', () => {
		expect(parshiyosOf('חנוכה')).toEqual([]);
		expect(parshiyosOf('י"ט כסלו')).toEqual([]);
	});
});
