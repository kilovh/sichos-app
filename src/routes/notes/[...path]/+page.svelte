<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import NoteEditor from '#lib/components/NoteEditor.svelte';
	import { citation } from '#lib/format.ts';
	import { emptyNote, references } from '#lib/notes/note.ts';
	import { sourceLabel, sourceSearch, type Source } from '#lib/notes/sources.ts';
	import { store } from '#lib/store.svelte.ts';

	const path = $derived(`${page.params.path}.md`);
	const note = $derived(store.notes[path] ?? emptyNote(path));
	const source = $derived(note.extra.source as Source | undefined);
	const linked = $derived(references(note.body).map((id) => store.byId.get(id)).filter((s) => s !== undefined));

	let title = $state('');
	$effect(() => {
		title = note.title ?? '';
	});
</script>

<main class="page">
	<a class="back ui muted" href={resolve('/notes')}>← Notes</a>
	<input
		class="title"
		bind:value={title}
		dir="auto"
		placeholder="Title"
		onblur={() => title.trim() !== (note.title ?? '') && store.save({ ...note, title: title.trim() }, `retitle ${path}`)}
	/>
	{#if source}
		<p class="ui muted">
			{sourceLabel(source)} · <a href={sourceSearch(source)} target="_blank" rel="noopener">find it ↗</a>
		</p>
	{/if}

	<NoteEditor
		{note}
		onsave={(body) => store.save({ ...note, body }, `edit ${path}`)}
		placeholder="Write freely. Link sichos with [[ls-15-7]] — they'll link back here."
	/>

	{#if linked.length}
		<section>
			<h2 class="eyebrow">Sichos linked here</h2>
			<ul>
				{#each linked as s (s.id)}
					<li>
						<a class="he" href={resolve('/s/[id]', { id: s.id })}>{s.title} · {citation(s)}</a>
						{#if store.isLearned(s.id)}<span class="ui muted">✓</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>

<style>
	.back {
		display: inline-block;
		margin-bottom: 14px;
	}
	.title {
		width: 100%;
		border: 0;
		background: none;
		padding: 0;
		margin-bottom: 8px;
		font: 500 32px/1.2 var(--serif), var(--he);
	}
	.title:focus {
		outline: none;
	}
	p a {
		color: var(--accent);
	}
	section {
		margin-top: 28px;
	}
	ul {
		padding-inline-start: 18px;
	}
	li a {
		color: var(--accent);
		font-size: 17px;
	}
</style>
