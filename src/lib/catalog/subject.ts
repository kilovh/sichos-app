// What a sicha is about, reduced to one comparable key — so that mafteiach's headings and other
// sites' names for the same sicha agree: `חוקת`/`חקת`, `מטו"מ`/`מטות מסעי`, `חה"ס`/`חג הסוכות`.
import { normalize } from '../hebrew.ts';
import { parshiyosOf } from './parshiyos.ts';

// Moadim, written out in full → mafteiach's abbreviation (both after normalize and with spaces removed).
const MOADIM: Record<string, string> = {
	חגהסוכות: 'חהס',
	סוכות: 'חהס',
	חגסוכות: 'חהס',
	חגהפסח: 'חהפ',
	פסח: 'חהפ',
	חגהשבועות: 'חהש',
	שבועות: 'חהש',
	שמחתתורה: 'שמחת',
	שבתהגדול: 'שהג',
	ראשהשנה: 'רה',
	יוםהכיפורימ: 'יוהכ',
	יוםכיפור: 'יוהכ',
	חמשהעשרבאב: 'טובאב',
	הושענארבה: 'הושער',
	פרשתשקלימ: 'פשקלימ',
	פרשתזכור: 'פזכור',
	פרשתפרה: 'פפרה',
	פרה: 'פפרה',
	פרשתהחודש: 'פהחודש',
	ימימהאחרונימשלחגהפסח: 'ימימאחרונימדחגהפסח',
	שביעיופסח: 'שביעישלפסח',
	ישבט: 'יודשבט',
	כפאב: 'כאב'
};

const squash = (s: string) => normalize(s).replace(/[\s\-–־.,]+/g, '');

/** `ויקהל-פקודי` → `ויקהל+פקודי`; `חג הסוכות` → `חהס`; anything else → its squashed self. */
export function subject(heading: string): string {
	let parshiyos = parshiyosOf(heading);
	// "מטות מסעי", "בהר ל"ג בעומר": parshiyos separated by spaces rather than dashes.
	if (!parshiyos.length) parshiyos = parshiyosOf(heading.replace(/\s+/g, '-'));
	if (parshiyos.length) return parshiyos.join('+');
	const s = squash(heading);
	return MOADIM[s] ?? s;
}
