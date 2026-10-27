<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Check from '#lib/components/Check.svelte';
	import NoteEditor from '#lib/components/NoteEditor.svelte';
	import Star from '#lib/components/Star.svelte';
	import { prettyDate } from '#lib/format.ts';
	import type { Note } from '#lib/notes/note.ts';
	import { store, tmDate } from '#lib/store.svelte.ts';

	const id = $derived(page.params.id ?? '');
	const entry = $derived(store.tmById.get(id));
	const note = $derived(store.note(id));
	const mentions = $derived(store.backlinks.get(id) ?? []);

	const index = $derived(store.tm.findIndex((f) => f.id === id));
	const prev = $derived(store.tm[index - 1]);
	const next = $derived(store.tm[index + 1]);

	const save = (patch: Partial<Note>, message: string) => store.save({ ...note, ...patch }, message);

	let copied = $state(false);
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(`[[${id}]]`);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}

	let newTag = $state('');
	function addTag() {
		const t = newTag.trim();
		if (t && !note.tags.includes(t)) save({ tags: [...note.tags, t] }, `tag ${id}`);
		newTag = '';
	}
</script>

{#if !entry}
	<main class="page muted ui">{store.tm.length ? `No entry "${id}".` : 'Loading…'}</main>
{:else}
	<main class="page">
		<nav class="crumbs ui he" dir="rtl">
			<a href={resolve('/tm')}>תורת מנחם</a>
			<span>·</span>
			<a href={resolve('/tm/[year]', { year: String(entry.year) })}>{entry.yearLabel}</a>
			<span>·</span>
			<span>{entry.month}</span>
		</nav>

		<header dir="rtl">
			<div class="title-row">
				<Check checked={store.isLearned(id)} size={30} label="Learned" onclick={() => store.toggleLearned(id)} />
				<h1 class="he">{entry.title}</h1>
				<Star on={store.isFavorite(id)} size={28} label="Favorite" onclick={() => store.toggleFavorite(id)} />
			</div>
			<p class="cite he">
				{tmDate(entry)}
				<button class="copy ui" dir="ltr" onclick={copyLink} title="Copy a link to paste into any note">
					{copied ? 'Copied' : `[[${id}]]`}
				</button>
			</p>
		</header>

		<div class="status ui">
			{#if note.learned.length}
				<span class="muted">Learned {note.learned.map(prettyDate).join(' · ')}</span>
			{:else}
				<span class="muted">Not learned yet</span>
			{/if}
		</div>

		<div class="links ui">
			<a class="btn primary" href={entry.url} target="_blank" rel="noopener">Sources & summary on Mafteiach ↗</a>
		</div>

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
					<input bind:value={newTag} placeholder="+ tag" dir="auto" size="8" />
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

		<nav class="pager ui he" dir="rtl">
			{#if prev}<a href={resolve('/t/[id]', { id: prev.id })}>→ {prev.title}</a>{:else}<span></span>{/if}
			{#if next}<a href={resolve('/t/[id]', { id: next.id })}>{next.title} ←</a>{/if}
		</nav>
	</main>
{/if}

<style>
	.crumbs {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		color: var(--muted);
		font-size: 15px;
		margin-bottom: 14px;
	}
	.crumbs a:hover {
		color: var(--accent);
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	h1 {
		font-size: 36px;
		line-height: 1.15;
		flex: 1;
	}
	.cite {
		margin: 6px 0 0;
		color: var(--muted);
		font-size: 17px;
	}
	.copy {
		margin-inline-start: 10px;
		border: 0;
		background: none;
		padding: 0;
		font-size: 13px;
		font-style: italic;
		color: var(--faint);
	}
	.copy:hover {
		color: var(--red);
	}
	.status {
		margin: 16px 0 12px;
	}
	.links {
		margin-bottom: 24px;
	}
	section {
		margin-bottom: 28px;
	}
	h2.eyebrow {
		margin: 0 0 8px;
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
	.mentions {
		margin: 0;
		padding-inline-start: 18px;
	}
	.mentions a {
		color: var(--accent);
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 16px;
	}
	.pager a:hover {
		color: var(--accent);
	}
</style>
