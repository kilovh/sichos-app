// Works logged as favorites rather than tracked as a checklist.
export const WORKS = {
	tm: { name: 'Toras Menachem', he: 'תורת מנחם', volume: 'vol.', where: 'page' },
	igros: { name: 'Igros Kodesh', he: 'אגרות קודש', volume: 'vol.', where: 'letter #' },
	other: { name: 'Other', he: '', volume: 'vol.', where: 'page' }
} as const;

export interface Source {
	work: keyof typeof WORKS;
	vol: string;
	/** Page for Toras Menachem, letter number for Igros. */
	where: string;
	date?: string;
}

export function sourceLabel(s: Source) {
	const w = WORKS[s.work] ?? WORKS.other;
	const where = s.where ? (s.work === 'igros' ? ` #${s.where}` : ` p. ${s.where}`) : '';
	return [`${w.name}${s.vol ? ` ${s.vol}` : ''}${where}`, s.date].filter(Boolean).join(' · ');
}

/** A web search for the source, until there's a catalog of where these volumes live online. */
export function sourceSearch(s: Source) {
	const w = WORKS[s.work] ?? WORKS.other;
	return `https://www.google.com/search?q=${encodeURIComponent(`${w.he} ${s.vol} ${s.where}`.trim())}`;
}
