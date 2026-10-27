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
		/** Full text on chabadlibrary.org (volumes 30–39 only). */
		chabadlibrary?: string;
		/** The sicha's hub on projectlikkuteisichos.org: shiurim, audio, summaries in several languages. */
		pls?: string;
		/** How many resources that hub lists. */
		plsCount?: number;
	};
}

/** A dated talk — farbrengen, sicha, bracha — from mafteiach's calendar; most are in Toras Menachem. */
export interface Farbrengen {
	/** `tm-{mafteiach date code}`, e.g. `tm-5720-01-16b`. Notes files are named after it. */
	id: string;
	year: number;
	/** The year as mafteiach writes it, e.g. `תש"כ`. */
	yearLabel: string;
	/** Hebrew month name, e.g. `תשרי`, `אדר ראשון`. */
	month: string;
	day: number;
	/** The occasion, e.g. `יום ב' דחה"ס`. */
	title: string;
	/** mafteiach's page for it: sources, PDF, summary. */
	url: string;
}
