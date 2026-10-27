<script lang="ts">
	import { resolve } from '$app/paths';
	import { store } from '#lib/store.svelte.ts';
</script>

<div class="grid he" dir="rtl">
	{#each [...store.tmYears] as [year, entries] (year)}
		{@const stars = entries.filter((e) => store.isFavorite(e.id)).length}
		{@const done = entries.filter((e) => store.isLearned(e.id)).length}
		<a class="cell" href={resolve('/tm/[year]', { year: String(year) })} title="{entries.length} entries">
			<span class="label">{entries[0].yearLabel}</span>
			<span class="meta ui" dir="ltr">
				{entries.length}{#if done}<span class="done"> · {done}✓</span>{/if}{#if stars}<span class="stars"> · {stars}★</span>{/if}
			</span>
		</a>
	{/each}
</div>

<style>
	/* Each cell draws its own hairline (the shadows meet in the 1px gaps), so a short last row ends cleanly. */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 1px;
		padding: 1px;
	}
	.cell {
		box-shadow: 0 0 0 1px var(--line);
		display: grid;
		place-items: center;
		align-content: center;
		gap: 2px;
		padding: 9px 4px 7px;
		background: var(--bg);
	}
	.cell:hover {
		outline: 1px solid var(--ink);
		outline-offset: -1px;
		z-index: 1;
	}
	.label {
		font-size: 20px;
		font-weight: 500;
		line-height: 1.1;
	}
	.meta {
		font-size: 11.5px;
		color: var(--faint);
	}
	.done {
		color: var(--ink);
	}
	.stars {
		color: var(--gold);
	}
</style>
