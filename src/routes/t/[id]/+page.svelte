<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Check from '#lib/components/Check.svelte';
	import EntryNotes from '#lib/components/EntryNotes.svelte';
	import Star from '#lib/components/Star.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { store, tmDate } from '#lib/store.svelte.ts';

	const id = $derived(page.params.id ?? '');
	const entry = $derived(store.tmById.get(id));
	const note = $derived(store.note(id));

	const index = $derived(store.tm.findIndex((f) => f.id === id));
	const prev = $derived(store.tm[index - 1]);
	const next = $derived(store.tm[index + 1]);


	let copied = $state(false);
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(`[[${id}]]`);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
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

		<EntryNotes {id} />

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
