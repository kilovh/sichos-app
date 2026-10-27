import MiniSearch from 'minisearch';
import type { Sicha } from './catalog/types';
import { normalize } from './hebrew';
import type { Note } from './notes/note';

export interface Hit {
	id: string;
	type: 'sicha' | 'note';
	/** For a sicha: its id. For a note: its path. */
	ref: string;
	score: number;
}

const PREFIXES = /^[והבכלמש]{1,2}/;

/**
 * Hebrew glues prefixes onto words (המבול, ובתורה), so each word is also indexed without them,
 * as long as at least three letters remain.
 */
export function indexTerms(t: string): string[] | null {
	const n = normalize(t);
	if (!n) return null;
	const terms = [n];
	const m = n.match(PREFIXES);
	if (m) for (let i = 1; i <= m[0].length; i++) if (n.length - i >= 3) terms.push(n.slice(i));
	return terms;
}

/** One searchable document per catalog entry (with its notes folded in) and one per free-standing note. */
export function buildIndex(catalog: Sicha[], notes: Record<string, Note>) {
	const index = new MiniSearch({
		fields: ['title', 'groups', 'summary', 'body', 'tags'],
		storeFields: ['type', 'ref'],
		processTerm: indexTerms,
		searchOptions: {
			processTerm: (t) => normalize(t) || null,
			boost: { title: 3, tags: 2, body: 1.5 },
			prefix: true,
			fuzzy: (t) => (t.length > 4 ? 0.15 : 0)
		}
	});
	const docs = catalog
		.filter((s) => s.kind !== 'meta')
		.map((s) => {
			const n = notes[`ls/${s.id}.md`];
			return {
				id: s.id,
				type: 'sicha',
				ref: s.id,
				title: s.title,
				groups: s.groups.join(' '),
				summary: s.summary ?? '',
				body: n?.body ?? '',
				tags: n ? [...n.tags, ...n.auto_tags].join(' ') : ''
			};
		});
	for (const [path, n] of Object.entries(notes)) {
		if (path.startsWith('ls/')) continue;
		docs.push({
			id: path,
			type: 'note',
			ref: path,
			title: n.title ?? path,
			groups: '',
			summary: '',
			body: n.body,
			tags: [...n.tags, ...n.auto_tags].join(' ')
		});
	}
	index.addAll(docs);
	return (q: string): Hit[] => index.search(q).map((r) => ({ id: r.id, type: r.type, ref: r.ref, score: r.score }));
}
