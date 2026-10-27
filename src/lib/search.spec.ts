import { describe, expect, it } from 'vitest';
import type { Sicha } from './catalog/types';
import { parseNote } from './notes/note';
import { buildIndex, indexTerms } from './search';

const s = (id: string, title: string, summary: string): Sicha => ({
	id, vol: 1, title, kind: 'sicha', groups: [title], summary, links: {}
});

const search = buildIndex(
	[s('ls-1-4', 'נח', 'מי המבול מטהרים'), s('ls-1-15', 'לך לך', 'לידת יצחק למעלה מהטבע')],
	{
		'ls/ls-1-15.md': parseNote('ls/ls-1-15.md', '---\ntags: [mesiras nefesh]\n---\nGoing beyond oneself'),
		'thoughts/galus.md': parseNote('thoughts/galus.md', '---\ntitle: Galus as a dream\n---\nSee [[ls-1-4]]')
	}
);

describe('indexTerms', () => {
	it('adds prefix-stripped forms', () => {
		expect(indexTerms('המבול')).toContain('מבול');
		expect(indexTerms('ובתורה')).toEqual(['ובתורה', 'בתורה', 'תורה']);
		expect(indexTerms('לך')).toEqual(['לכ']);
	});
});

describe('search', () => {
	it('matches Hebrew regardless of niqqud and final letters', () => {
		expect(search('מַבּוּל')[0].ref).toBe('ls-1-4');
		expect(search('לך')[0].ref).toBe('ls-1-15');
	});

	it('finds notes and tags in English', () => {
		expect(search('beyond')[0].ref).toBe('ls-1-15');
		expect(search('mesiras')[0].ref).toBe('ls-1-15');
		expect(search('dream')[0]).toMatchObject({ type: 'note', ref: 'thoughts/galus.md' });
	});
});
