import type { Sicha } from './catalog/types';
import { hebrewNumeral } from './hebrew';

export const volLabel = (vol: number) => `חלק ${hebrewNumeral(vol)}`;

/** `חט"ו ע' 34`, the conventional short citation. */
export const citation = (s: Sicha) => {
	const n = hebrewNumeral(s.vol).replace(/['"]/g, '');
	const short = n.length === 1 ? `ח"${n}` : `ח${n.slice(0, -1)}"${n.slice(-1)}`;
	return s.page ? `${short} ע' ${s.page}` : short;
};

export const prettyDate = (iso: string) =>
	new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const slugify = (s: string) =>
	s
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 60) || 'note';
