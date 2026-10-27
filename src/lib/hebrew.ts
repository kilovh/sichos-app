const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** Folds Hebrew for search: drops niqqud/cantillation and quote marks, folds final letters, lowercases Latin. */
export function normalize(s: string): string {
	return s
		.normalize('NFD')
		.replace(/[֑-ׇ]/g, '')
		.replace(/[״׳"'`”“’‘]/g, '')
		.replace(/[ךםןףץ]/g, (c) => FINALS[c])
		.toLowerCase();
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

/** 15 → `ט"ו`, 1 → `א'`. Good for 1–499 (volumes and page numbers). */
export function hebrewNumeral(n: number): string {
	let s = HUNDREDS[Math.floor(n / 100)] + TENS[Math.floor((n % 100) / 10)] + ONES[n % 10];
	s = s.replace('יה', 'טו').replace('יו', 'טז');
	return s.length === 1 ? `${s}'` : `${s.slice(0, -1)}"${s.slice(-1)}`;
}
