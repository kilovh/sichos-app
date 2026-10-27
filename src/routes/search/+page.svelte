<script lang="ts">
	import { resolve } from '$app/paths';
	import SichaRow from '#lib/components/SichaRow.svelte';
	import TmRow from '#lib/components/TmRow.svelte';
	import { buildIndex } from '#lib/search.ts';
	import { store } from '#lib/store.svelte.ts';

	let q = $state('');
	let filter = $state<'all' | 'learned' | 'unlearned' | 'noted'>('all');

	// Rebuilt when notes change; ~2k small documents, so this stays fast.
	const search = $derived(buildIndex(store.catalog, store.notes, store.tm));
	const hits = $derived.by(() => {
		if (q.trim().length < 2) return [];
		return search(q)
			.filter((h) => {
				if (h.type === 'note') return filter === 'all' || filter === 'noted';
				const n = store.notes[`${h.type === 'tm' ? 'tm' : 'ls'}/${h.ref}.md`];
				if (filter === 'learned') return n?.status === 'learned';
				if (filter === 'unlearned') return n?.status !== 'learned';
				if (filter === 'noted') return Boolean(n?.body.trim());
				return true;
			})
			.slice(0, 60);
	});
</script>

<main class="page">
	<!-- svelte-ignore a11y_autofocus -->
	<input class="q" type="search" bind:value={q} placeholder="Search sichos, Toras Menachem and notes — חפש…" dir="auto" autofocus />
	<div class="filters ui">
		{#each ['all', 'unlearned', 'learned', 'noted'] as f (f)}
			<button class:on={filter === f} onclick={() => (filter = f as typeof filter)}>{f === 'noted' ? 'with notes' : f}</button>
		{/each}
	</div>

	{#if q.trim().length >= 2}
		<p class="ui muted count">{hits.length === 60 ? '60+' : hits.length} results</p>
		{#each hits as h (h.id)}
			{#if h.type === 'sicha'}
				{@const s = store.byId.get(h.ref)}
				{#if s}<SichaRow sicha={s} showVolume />{/if}
			{:else if h.type === 'tm'}
				{@const f = store.tmById.get(h.ref)}
				{#if f}<TmRow entry={f} showYear />{/if}
			{:else}
				{@const n = store.notes[h.ref]}
				<a class="note" href={resolve('/notes/[...path]', { path: h.ref.replace(/\.md$/, '') })}>
					<span class="eyebrow">Note</span>
					<span dir="auto" class="title">{n?.title ?? h.ref}</span>
					<span dir="auto" class="excerpt muted">{n?.body.slice(0, 160)}</span>
				</a>
			{/if}
		{/each}
	{:else}
		<p class="ui muted">Search titles, Mafteiach summaries, your notes and tags. Hebrew works without nikud or prefixes: <span class="he">מבול</span> finds <span class="he">המבול</span>.</p>
	{/if}
</main>

<style>
	.q {
		width: 100%;
		padding: 14px 16px;
		font-size: 20px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: var(--serif), var(--he);
	}
	.q:focus {
		outline: none;
		border-color: var(--accent);
	}
	.filters {
		display: flex;
		gap: 6px;
		margin: 10px 0 18px;
	}
	.filters button {
		border: 1px solid var(--line);
		background: none;
		border-radius: 999px;
		padding: 3px 12px;
		text-transform: capitalize;
		color: var(--muted);
	}
	.filters button.on {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--ink);
	}
	.count {
		margin: 0 0 4px;
	}
	.note {
		display: grid;
		gap: 2px;
		padding: 12px 4px;
		border-bottom: 1px solid var(--line);
	}
	.note .title {
		font-size: 18px;
	}
	.excerpt {
		font-size: 15px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
