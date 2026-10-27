<script lang="ts">
	import { resolve } from '$app/paths';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { store } from '#lib/store.svelte.ts';
</script>

<!-- Ruled square cells; each fills from the bottom as its volume is learned. -->
<div class="grid" dir="rtl">
	{#each [...store.volumes] as [vol, sichos] (vol)}
		{@const p = store.progress(sichos)}
		{@const pct = (100 * p.done) / (p.total || 1)}
		<a
			class="cell"
			href={resolve('/vol/[n]', { n: String(vol) })}
			class:complete={p.total && p.done === p.total}
			style:--pct="{pct}%"
			title="{p.done} of {p.total} learned"
		>
			<span class="num he">{hebrewNumeral(vol)}</span>
			<span class="count ui" dir="ltr">{p.done ? `${p.done}/` : ''}{p.total}</span>
		</a>
	{/each}
</div>

<style>
	/* Each cell draws its own hairline (the shadows meet in the 1px gaps), so a short last row ends cleanly. */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		gap: 1px;
		padding: 1px;
	}
	.cell {
		box-shadow: 0 0 0 1px var(--line);
		position: relative;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		align-content: center;
		gap: 2px;
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--red) 14%, var(--bg)) var(--pct),
			var(--bg) var(--pct)
		);
		transition: background 0.3s;
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
	.count {
		font-size: 11.5px;
		color: var(--faint);
	}
	.complete .num,
	.complete .count {
		color: var(--red);
	}
</style>
