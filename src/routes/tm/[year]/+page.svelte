<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import TmRow from '#lib/components/TmRow.svelte';
	import type { Farbrengen } from '#lib/catalog/types.ts';
	import { store } from '#lib/store.svelte.ts';

	const year = $derived(Number(page.params.year));
	const entries = $derived(store.tmYears.get(year) ?? []);
	const years = $derived([...store.tmYears.keys()]);
	const prev = $derived(years[years.indexOf(year) - 1]);
	const next = $derived(years[years.indexOf(year) + 1]);

	const months = $derived.by(() => {
		const out: { month: string; entries: Farbrengen[] }[] = [];
		for (const e of entries) {
			if (out.at(-1)?.month === e.month) out.at(-1)!.entries.push(e);
			else out.push({ month: e.month, entries: [e] });
		}
		return out;
	});
	let onlyStars = $state(false);
</script>

<main class="page">
	<nav class="pager ui he" dir="rtl">
		{#if prev}<a href={resolve('/tm/[year]', { year: String(prev) })}>→ {store.tmYears.get(prev)?.[0].yearLabel}</a>{:else}<span></span>{/if}
		<a href={resolve('/tm')}>כל השנים</a>
		{#if next}<a href={resolve('/tm/[year]', { year: String(next) })}>{store.tmYears.get(next)?.[0].yearLabel} ←</a>{:else}<span></span>{/if}
	</nav>

	<header class="he" dir="rtl">
		<p class="eyebrow">תורת מנחם</p>
		<h1>שנת {entries[0]?.yearLabel ?? year}</h1>
		<label class="ui filter" dir="ltr"><input type="checkbox" bind:checked={onlyStars} /> Favorites only</label>
	</header>

	{#each months as m (m.month)}
		{@const list = onlyStars ? m.entries.filter((e) => store.isFavorite(e.id)) : m.entries}
		{#if list.length}
			<section>
				<h2 class="he" dir="rtl">{m.month}</h2>
				{#each list as e (e.id)}<TmRow entry={e} />{/each}
			</section>
		{/if}
	{:else}
		<p class="ui muted">{store.tm.length ? 'Nothing for this year.' : 'Loading…'}</p>
	{/each}
</main>

<style>
	.pager {
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		margin-bottom: 18px;
		font-size: 16px;
	}
	.pager a:hover {
		color: var(--accent);
	}
	header {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-bottom: 8px;
	}
	header .eyebrow {
		width: 100%;
		margin: 0;
	}
	h1 {
		font-size: 38px;
	}
	.filter {
		margin-inline-start: auto;
		color: var(--muted);
		display: inline-flex;
		gap: 6px;
		align-items: center;
	}
	section {
		margin-top: 22px;
	}
	h2 {
		font-size: 15px;
		color: var(--muted);
		font-weight: 500;
		padding-bottom: 4px;
		border-bottom: 1px solid var(--line);
	}
</style>
