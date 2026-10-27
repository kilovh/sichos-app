// A note is a Markdown file with YAML frontmatter. Files live in the notes repo:
//   ls/{sicha id}.md       notes on one Likkutei Sichos entry (the checklist state lives here too)
//   tm/{entry id}.md       the same for a Toras Menachem entry, e.g. tm/tm-5720-01-16b.md
//   thoughts/{slug}.md     free-standing ideas that link to sichos with [[ls-15-7]]
//   log/{slug}.md          favorites from Toras Menachem and Igros
import { Document, isMap, isSeq, parse } from 'yaml';

export type Status = 'learned' | 'in-progress' | 'revisit';

export interface Section {
	name: string;
	done: boolean;
	note?: string;
}

export interface Note {
	path: string;
	status?: Status;
	/** Starred — for Toras Menachem, the "sichos I like" log. */
	favorite?: boolean;
	/** ISO dates, one per time through. */
	learned: string[];
	tags: string[];
	/** Written by the tagging Action; kept apart so it can be regenerated without touching yours. */
	auto_tags: string[];
	/** Present (even empty) once "track sections" is switched on. */
	sections?: Section[];
	title?: string;
	/** Anything else in the frontmatter, preserved as-is. */
	extra: Record<string, unknown>;
	body: string;
}

const KNOWN = ['status', 'favorite', 'learned', 'tags', 'auto_tags', 'sections', 'title'];

export const emptyNote = (path: string): Note => ({ path, learned: [], tags: [], auto_tags: [], extra: {}, body: '' });

export function parseNote(path: string, text: string): Note {
	const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	const fm: Record<string, unknown> = (m && parse(m[1])) || {};
	const extra = Object.fromEntries(Object.entries(fm).filter(([k]) => !KNOWN.includes(k)));
	const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
	return {
		path,
		status: fm.status as Status | undefined,
		favorite: fm.favorite === true || undefined,
		learned: list(fm.learned),
		tags: list(fm.tags),
		auto_tags: list(fm.auto_tags),
		sections: Array.isArray(fm.sections) ? (fm.sections as Section[]) : undefined,
		title: fm.title as string | undefined,
		extra,
		body: (m ? m[2] : text).replace(/^\n+/, '')
	};
}

export function serializeNote(n: Note): string {
	const fm: Record<string, unknown> = {};
	if (n.title) fm.title = n.title;
	if (n.status) fm.status = n.status;
	if (n.favorite) fm.favorite = true;
	if (n.learned.length) fm.learned = n.learned;
	if (n.sections) fm.sections = n.sections.map((s) => (s.note ? s : { name: s.name, done: s.done }));
	if (n.tags.length) fm.tags = n.tags;
	if (n.auto_tags.length) fm.auto_tags = n.auto_tags;
	Object.assign(fm, n.extra);
	const doc = new Document(fm);
	// Short lists stay on one line: `learned: [2026-10-20, 2026-10-27]`, `- { name: א, done: true }`.
	for (const key of ['learned', 'tags', 'auto_tags']) {
		const node = doc.get(key, true);
		if (isSeq(node)) node.flow = true;
	}
	const sections = doc.get('sections', true);
	if (isSeq(sections)) for (const item of sections.items) if (isMap(item)) item.flow = true;
	const head = Object.keys(fm).length ? `---\n${doc.toString({ lineWidth: 0 }).trimEnd()}\n---\n` : '';
	return head + (n.body.trim() ? `\n${n.body.trim()}\n` : '');
}

/** `[[ls-15-7]]` references in a note's body. */
export function references(body: string): string[] {
	return [...new Set([...body.matchAll(/\[\[([a-z]+-[\w-]+?)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]))];
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/**
 * Three-way merge for when the same note changed on two devices.
 * Lists are unioned; scalar fields prefer ours; if both sides edited the body, both are kept, marked.
 */
export function mergeNotes(base: Note | undefined, ours: Note, theirs: Note): Note {
	const baseBody = base?.body.trim() ?? '';
	const [o, t] = [ours.body.trim(), theirs.body.trim()];
	const body =
		o === t || t === baseBody ? o : o === baseBody ? t : `${o}\n\n<!-- also edited on another device: -->\n\n${t}`;

	let sections = ours.sections ?? theirs.sections;
	if (ours.sections && theirs.sections) {
		const names = union(ours.sections.map((s) => s.name), theirs.sections.map((s) => s.name));
		sections = names.map((name) => {
			const a = ours.sections!.find((s) => s.name === name);
			const b = theirs.sections!.find((s) => s.name === name);
			return { ...b, ...a, name, done: Boolean(a?.done || b?.done) } as Section;
		});
	}

	return {
		...theirs,
		...ours,
		learned: union(theirs.learned, ours.learned).sort(),
		tags: union(theirs.tags, ours.tags),
		auto_tags: theirs.auto_tags.length ? theirs.auto_tags : ours.auto_tags,
		sections,
		extra: { ...theirs.extra, ...ours.extra },
		body
	};
}
