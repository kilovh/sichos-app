export interface Sicha {
	/** Stable key: `ls-{volume}-{n}`, n being mafteiach's number (the start page for sichos). Notes files are named after it. */
	id: string;
	vol: number;
	page?: number;
	/** The sicha's own label, e.g. "נח ב" or "כ' מ"ח". */
	title: string;
	/** Position within its parsha when there are several (א → 1). */
	index?: number;
	/** `hosafa`: the letters and additions at the back of a volume. `meta`: indexes and printing lists — not part of the checklist. */
	kind: 'sicha' | 'hosafa' | 'meta';
	/** Parsha / moed headings it appears under on mafteiach; usually one. */
	groups: string[];
	summary?: string;
	links: {
		pdf?: string;
		translation?: string;
		mafteiach?: string;
	};
}
