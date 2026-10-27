<script lang="ts">
	import type { Note } from '#lib/notes/note.ts';
	import { store } from '#lib/store.svelte.ts';
	import NoteEditor from './NoteEditor.svelte';

	/** Notes, tags and backlinks for any catalog entry — a TM talk, a letter. */
	let { id }: { id: string } = $props();

	const note = $derived(store.note(id));
	const mentions = $derived(store.backlinks.get(id) ?? []);
	const save = (patch: Partial<Note>, message: string) => store.save({ ...note, ...patch }, message);

	let newTag = $state('');
	function addTag() {
		const t = newTag.trim();
		if (t && !note.tags.includes(t)) save({ tags: [...note.tags, t] }, `tag ${id}`);
		newTag = '';
	}
</script>

<section>
	<h2 class="eyebrow">Notes</h2>
	<NoteEditor {note} onsave={(body) => save({ body }, `note on ${id}`)} />
</section>

<section>
	<h2 class="eyebrow">Tags</h2>
	<div class="tags">
		{#each note.tags as t (t)}
			<span class="chip">
				<span dir="auto">{t}</span>
				<button class="remove" aria-label="Remove tag {t}" onclick={() => save({ tags: note.tags.filter((x) => x !== t) }, `untag ${id}`)}>×</button>
			</span>
		{/each}
		{#each note.auto_tags.filter((t) => !note.tags.includes(t)) as t (t)}
			<span class="chip auto" title="Added automatically"><span dir="auto">{t}</span></span>
		{/each}
		<form class="ui" onsubmit={(e) => (e.preventDefault(), addTag())}>
			<input bind:value={newTag} placeholder="+ tag" dir="auto" />
		</form>
	</div>
</section>

{#if mentions.length}
	<section>
		<h2 class="eyebrow">Mentioned in</h2>
		<ul class="mentions">
			{#each mentions as path (path)}
				{@const l = store.labelOfPath(path)}
				<li><a href={l.href} class="he" dir="auto">{l.title}{l.cite ? ` · ${l.cite}` : ''}</a></li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	section {
		margin-bottom: 30px;
	}
	h2.eyebrow {
		margin: 0 0 10px;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 6px 18px;
	}
	.tags input {
		width: 9em;
		font-size: 15px;
	}
	.remove {
		border: 0;
		background: none;
		padding: 0 2px;
		color: var(--faint);
		font-size: 15px;
		line-height: 1;
	}
	.remove:hover {
		color: var(--red);
	}
	.mentions {
		margin: 0;
		padding-inline-start: 18px;
	}
	.mentions a {
		text-decoration: underline;
		text-decoration-color: var(--faint);
		text-underline-offset: 0.18em;
	}
	.mentions a:hover {
		color: var(--red);
	}
</style>
