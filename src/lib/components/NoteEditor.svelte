<script lang="ts">
	import { resolve } from '$app/paths';
	import { renderMarkdown } from '#lib/markdown.ts';
	import type { Note } from '#lib/notes/note.ts';
	import { store } from '#lib/store.svelte.ts';

	let {
		note,
		onsave,
		placeholder = 'Your notes — Hebrew, English, or both. Each paragraph aligns itself.'
	}: { note: Note; onsave: (body: string) => void; placeholder?: string } = $props();

	let editing = $state(false);
	let draft = $state('');
	let textarea = $state<HTMLTextAreaElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Take in the stored body when opening a different note, or when a sync brings a newer one —
	// but never while the user is typing.
	$effect(() => {
		const body = note.body;
		if (!editing) draft = body;
	});

	const html = $derived(
		renderMarkdown(note.body, store.byId, (id) => resolve('/s/[id]', { id }))
	);

	function commit() {
		clearTimeout(timer);
		if (draft.trim() !== note.body.trim()) onsave(draft);
	}

	function input() {
		clearTimeout(timer);
		timer = setTimeout(commit, 1200);
		autosize();
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
			editing = false;
		}}
		rows="4"
	></textarea>
	<p class="hint ui muted">Markdown works. Link a sicha with <code>[[ls-15-7]]</code>. Saves as you type.</p>
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
	<button class="btn edit" onclick={open}>Edit notes</button>
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
		margin: 6px 2px 0;
		font-size: 12.5px;
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
	.edit {
		margin-top: 4px;
	}
</style>
