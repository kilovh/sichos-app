<script lang="ts">
	import { resolve } from '$app/paths';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { store } from '#lib/store.svelte.ts';
</script>

<div class="grid" dir="rtl">
	{#each [...store.igVolumes] as [vol, letters] (vol)}
		{@const stars = letters.filter((l) => store.isFavorite(l.id)).length}
		{@const done = letters.filter((l) => store.isLearned(l.id)).length}
		<a class="cell" href={resolve('/igros/[vol]', { vol: String(vol) })} title="Letters {letters[0].num}–{letters.at(-1)?.num}">
			<span class="num he">{hebrewNumeral(vol)}</span>
			<span class="meta ui" dir="ltr">
				{letters.length}{#if done}<span class="done"> · {done}✓</span>{/if}{#if stars}<span class="stars"> · {stars}★</span>{/if}
			</span>
		</a>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 1px;
		padding: 1px;
	}
	.cell {
		box-shadow: 0 0 0 1px var(--line);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		align-content: center;
		gap: 2px;
		background: var(--bg);
	}
	.cell:hover {
		outline: 1px solid var(--ink);
		outline-offset: -1px;
		z-index: 1;
	}
	.num {
		font-size: 24px;
		font-weight: 500;
		line-height: 1;
	}
	.meta {
		font-size: 11px;
		color: var(--faint);
	}
	.done {
		color: var(--ink);
	}
	.stars {
		color: var(--gold);
	}
</style>
