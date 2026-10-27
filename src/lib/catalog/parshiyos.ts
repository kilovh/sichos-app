// Torah order, used to sort the "by parsha" view and map mafteiach's headings onto parshiyos.
export const SEFARIM: { name: string; parshiyos: string[] }[] = [
	{
		name: 'בראשית',
		parshiyos: ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי']
	},
	{
		name: 'שמות',
		parshiyos: ['שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי']
	},
	{
		name: 'ויקרא',
		parshiyos: ['ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי', 'קדושים', 'אמור', 'בהר', 'בחוקותי']
	},
	{
		name: 'במדבר',
		parshiyos: ['במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חוקת', 'בלק', 'פינחס', 'מטות', 'מסעי']
	},
	{
		name: 'דברים',
		parshiyos: ['דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'תצא', 'תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה']
	}
];

const ORDER = SEFARIM.flatMap((s) => s.parshiyos);

// Spellings and abbreviations seen in mafteiach headings.
const ALIASES: Record<string, string[]> = {
	'כי תצא': ['תצא'],
	'כי תבוא': ['תבוא'],
	תבא: ['תבוא'],
	'אחרי מות': ['אחרי'],
	בחקתי: ['בחוקותי'],
	בחקותי: ['בחוקותי'],
	חקת: ['חוקת'],
	קורח: ['קרח'],
	פנחס: ['פינחס'],
	תשא: ['כי תשא'],
	ברכה: ['וזאת הברכה'],
	'ויקה"פ': ['ויקהל', 'פקודי'],
	'ויק"פ': ['ויקהל', 'פקודי'],
	'תזו"מ': ['תזריע', 'מצורע'],
	'אחו"ק': ['אחרי', 'קדושים'],
	'בהו"ב': ['בהר', 'בחוקותי'],
	'חוקו"ב': ['חוקת', 'בלק'],
	'מטו"מ': ['מטות', 'מסעי'],
	'נצו"י': ['נצבים', 'וילך']
};

/**
 * The parshiyos a heading refers to. `ויקהל-פקודי` gives both; `וירא-כ' מ"ח` gives וירא;
 * a heading that names no parsha (a moed, a month) gives none.
 */
export function parshiyosOf(heading: string): string[] {
	const found: string[] = [];
	for (const part of heading.split(/\s*[-–]\s*/)) {
		for (const p of ALIASES[part] ?? [part]) if (ORDER.includes(p) && !found.includes(p)) found.push(p);
	}
	return found;
}

export const parshaOrder = (p: string) => ORDER.indexOf(p);
