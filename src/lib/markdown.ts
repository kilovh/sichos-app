import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { Sicha } from './catalog/types';
import { citation } from './format';

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Markdown → safe HTML, with `[[ls-15-7]]` / `[[ls-15-7|label]]` turned into links to that sicha. */
export function renderMarkdown(md: string, byId: Map<string, Sicha>, linkTo: (id: string) => string): string {
	const linked = md.replace(/\[\[([a-z]+-[\w-]+?)(?:\|([^\]]*))?\]\]/g, (_, id: string, label?: string) => {
		const s = byId.get(id);
		const text = label ?? (s ? `${s.title} (${citation(s)})` : id);
		// An HTML link with dir="auto" is bidi-isolated, so a Hebrew citation inside an English sentence
		// keeps its own order — `נח (ח"א ע' 4)` rather than a scrambled mix.
		return `<a href="${linkTo(id)}" dir="auto">${escape(text)}</a>`;
	});
	return DOMPurify.sanitize(marked.parse(linked, { async: false, breaks: true }));
}
