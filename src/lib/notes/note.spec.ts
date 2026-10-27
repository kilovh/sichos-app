import { describe, expect, it } from 'vitest';
import { emptyNote, mergeNotes, parseNote, references, serializeNote } from './note';

const text = `---
status: learned
learned: [2026-10-20]
sections:
  - { name: א, done: true }
  - { name: ב, done: false }
tags: [אהבת ישראל]
source: imported
---

The point of **"לך לך"** is going beyond oneself.

הליכה מעצמו — not just from one's land.
`;

describe('parseNote / serializeNote', () => {
	it('round-trips, keeping unknown fields', () => {
		const n = parseNote('ls/ls-1-15.md', text);
		expect(n).toMatchObject({
			status: 'learned',
			learned: ['2026-10-20'],
			sections: [
				{ name: 'א', done: true },
				{ name: 'ב', done: false }
			],
			tags: ['אהבת ישראל'],
			extra: { source: 'imported' }
		});
		expect(n.body.startsWith('The point')).toBe(true);
		expect(parseNote(n.path, serializeNote(n))).toEqual(n);
	});

	it('reads a file without frontmatter as plain body', () => {
		expect(parseNote('x.md', 'just text').body).toBe('just text');
	});

	it('writes nothing for an empty note', () => {
		expect(serializeNote(emptyNote('x.md'))).toBe('');
	});
});

describe('references', () => {
	it('finds wiki links, with or without labels', () => {
		expect(references('see [[ls-15-7]] and [[ls-1-4|Noach]] and [[ls-15-7]]')).toEqual(['ls-15-7', 'ls-1-4']);
	});
});

describe('mergeNotes', () => {
	const base = parseNote('a.md', text);
	const edit = (patch: Partial<typeof base>) => ({ ...base, ...patch });

	it('takes the only side that changed the body', () => {
		expect(mergeNotes(base, base, edit({ body: 'theirs' })).body).toBe('theirs');
		expect(mergeNotes(base, edit({ body: 'ours' }), base).body).toBe('ours');
	});

	it('keeps both bodies when both changed', () => {
		const m = mergeNotes(base, edit({ body: 'ours' }), edit({ body: 'theirs' }));
		expect(m.body).toContain('ours');
		expect(m.body).toContain('theirs');
	});

	it('unions dates and ORs section checkmarks', () => {
		const m = mergeNotes(
			base,
			edit({ learned: ['2026-10-20', '2026-10-27'] }),
			edit({ sections: [{ name: 'א', done: true }, { name: 'ב', done: true }] })
		);
		expect(m.learned).toEqual(['2026-10-20', '2026-10-27']);
		expect(m.sections?.every((s) => s.done)).toBe(true);
	});
});
