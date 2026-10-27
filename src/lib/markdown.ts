import DOMPurify from 'dompurify';
import { marked } from 'marked';

type Label = (id: string) => { title: string; cite: string; href: string } | undefined;

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Markdown → safe HTML, with `[[ls-15-7]]`, `[[tm-5720-01-16b]]` or `[[id|label]]` turned into links. */
export function renderMarkdown(md: string, label: Label): string {
	const linked = md.replace(/\[\[([a-z]+-[\w-]+?)(?:\|([^\]]*))?\]\]/g, (raw, id: string, text?: string) => {
		const l = label(id);
		if (!l) return raw;
		// An HTML link with dir="auto" is bidi-isolated, so a Hebrew citation inside an English sentence
		// keeps its own order — `נח (ח"א ע' 4)` rather than a scrambled mix.
		return `<a href="${l.href}" dir="auto">${escape(text ?? `${l.title} (${l.cite})`)}</a>`;
	});
	return DOMPurify.sanitize(marked.parse(linked, { async: false, breaks: true }));
}
