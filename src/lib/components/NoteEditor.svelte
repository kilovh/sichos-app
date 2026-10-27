<script lang="ts">
	import { tick } from 'svelte';
	import type { Farbrengen, Sicha } from '#lib/catalog/types.ts';
	import { renderMarkdown } from '#lib/markdown.ts';
	import type { Note } from '#lib/notes/note.ts';
	import { store } from '#lib/store.svelte.ts';
	import SichaPicker from './SichaPicker.svelte';

	let {
		note,
		onsave,
		placeholder = 'Your notes — Hebrew, English, or both. Each paragraph aligns itself.'
	}: { note: Note; onsave: (body: string) => void; placeholder?: string } = $props();

	let editing = $state(false);
	let draft = $state('');
	let textarea = $state<HTMLTextAreaElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;
	/** Open while choosing a sicha to link; `from` is where a typed `[[` starts, if that's what opened it. */
	let picking = $state<{ from?: number; at: number } | null>(null);
	let copied = $state('');

	// Take in the stored body when opening a different note, or when a sync brings a newer one —
	// but never while the user is typing.
	$effect(() => {
		const body = note.body;
		if (!editing) draft = body;
	});

	const html = $derived(renderMarkdown(note.body, (id) => store.label(id)));

	function commit() {
		clearTimeout(timer);
		if (draft.trim() !== note.body.trim()) onsave(draft);
	}

	function input() {
		clearTimeout(timer);
		timer = setTimeout(commit, 1200);
		autosize();
		const at = textarea?.selectionStart ?? 0;
		if (draft.slice(at - 2, at) === '[[' && draft[at - 3] !== '[') picking = { from: at - 2, at };
	}

	async function pickButton() {
		if (!editing) await open();
		const at = textarea?.selectionEnd ?? draft.length;
		picking = { at };
	}

	async function insert(s: Sicha | Farbrengen) {
		if (!picking) return;
		const link = `[[${s.id}]]`;
		const { from = picking.at, at } = picking;
		// Pad with spaces so the link doesn't fuse with neighbouring words.
		const before = draft.slice(0, from);
		const after = draft.slice(at);
		const pre = before && !/\s$/.test(before) && picking.from === undefined ? ' ' : '';
		const post = /^\s/.test(after) ? '' : ' ';
		draft = before + pre + link + post + after;
		const cursor = (before + pre + link + post).length;
		picking = null;
		try {
			await navigator.clipboard.writeText(link);
			copied = link;
			setTimeout(() => (copied = ''), 2500);
		} catch {}
		commit();
		await tick();
		textarea?.focus();
		textarea?.setSelectionRange(cursor, cursor);
		autosize();
	}

	async function closePicker() {
		const at = picking?.at;
		picking = null;
		await tick();
		textarea?.focus();
		if (at !== undefined) textarea?.setSelectionRange(at, at);
	}

	function autosize() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${textarea.scrollHeight + 2}px`;
	}

	async function open() {
		editing = true;
		await Promise.resolve();
		autosize();
		textarea?.focus();
	}
</script>

{#if editing || !note.body.trim()}
	<textarea
		bind:this={textarea}
		bind:value={draft}
		class="editor bidi"
		{placeholder}
		oninput={input}
		onfocus={() => ((editing = true), autosize())}
		onblur={() => {
			commit();
			// Stay in edit mode while the picker has focus.
			if (!picking) editing = false;
		}}
		rows="4"
	></textarea>
	<div class="hint ui muted">
		<button class="btn small" onmousedown={(e) => e.preventDefault()} onclick={pickButton}>＋ Link a sicha</button>
		<span>or type <code>[[</code> · Markdown works · saves as you type</span>
		{#if copied}<span class="copied">Copied {copied}</span>{/if}
	</div>
{:else}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="prose bidi"
		onclick={(e) => {
			if (!(e.target as HTMLElement).closest('a')) open();
		}}
	>
		{@html html}
	</div>
	<div class="actions">
		<button class="btn" onclick={open}>Edit notes</button>
		<button class="btn" onclick={pickButton}>＋ Link a sicha</button>
	</div>
{/if}

{#if picking}
	<SichaPicker onpick={insert} onclose={closePicker} />
{/if}

<style>
	.editor {
		width: 100%;
		min-height: 140px;
		padding: 14px 16px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font: 17px/1.65 var(--serif), var(--he);
		resize: none;
		overflow: hidden;
	}
	.editor:focus {
		outline: none;
		border-color: var(--accent);
	}
	.hint {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
		margin: 8px 2px 0;
		font-size: 12.5px;
	}
	.btn.small {
		padding: 4px 10px;
		font-size: 13px;
	}
	.copied {
		color: var(--done);
	}
	.prose {
		cursor: text;
		font-size: 17.5px;
		line-height: 1.7;
	}
	.prose :global(p) {
		margin: 0 0 0.8em;
	}
	.prose :global(a) {
		color: var(--accent);
		border-bottom: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
	}
	.prose :global(blockquote) {
		margin: 0 0 0.8em;
		padding-inline-start: 14px;
		border-inline-start: 3px solid var(--line);
		color: var(--muted);
	}
	.prose :global(:is(h1, h2, h3)) {
		margin: 1em 0 0.4em;
		font-size: 1.15em;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}
</style>
