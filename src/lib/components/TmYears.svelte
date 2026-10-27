<script lang="ts">
	import { resolve } from '$app/paths';
	import { store } from '#lib/store.svelte.ts';
</script>

<div class="grid he" dir="rtl">
	{#each [...store.tmYears] as [year, entries] (year)}
		{@const stars = entries.filter((e) => store.isFavorite(e.id)).length}
		{@const done = entries.filter((e) => store.isLearned(e.id)).length}
		<a class="year card" href={resolve('/tm/[year]', { year: String(year) })}>
			<span class="label">{entries[0].yearLabel}</span>
			<span class="meta ui" dir="ltr">
				{entries.length}
				{#if done}<span class="done">· {done} ✓</span>{/if}
				{#if stars}<span class="stars">· {stars} ★</span>{/if}
			</span>
		</a>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
		gap: 8px;
	}
	.year {
		display: grid;
		gap: 4px;
		padding: 10px 10px 8px;
	}
	.year:hover {
		border-color: var(--faint);
	}
	.label {
		font-size: 20px;
		font-weight: 500;
		line-height: 1.1;
	}
	.meta {
		font-size: 11.5px;
		color: var(--muted);
		text-align: right;
	}
	.done {
		color: var(--done);
	}
	.stars {
		color: var(--warn);
	}
</style>
