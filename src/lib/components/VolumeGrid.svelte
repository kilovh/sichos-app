<script lang="ts">
	import { resolve } from '$app/paths';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { store } from '#lib/store.svelte.ts';
</script>

<div class="grid" dir="rtl">
	{#each [...store.volumes] as [vol, sichos] (vol)}
		{@const p = store.progress(sichos)}
		<a class="vol card" href={resolve('/vol/[n]', { n: String(vol) })} class:complete={p.total && p.done === p.total}>
			<span class="num he">{hebrewNumeral(vol)}</span>
			<span class="bar"><span style:width="{(100 * p.done) / (p.total || 1)}%"></span></span>
			<span class="count ui" dir="ltr">{p.done}/{p.total}</span>
		</a>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
		gap: 8px;
	}
	.vol {
		display: grid;
		gap: 6px;
		padding: 10px 10px 8px;
		transition: border-color 0.15s;
	}
	.vol:hover {
		border-color: var(--faint);
	}
	.num {
		font-size: 22px;
		font-weight: 500;
		line-height: 1;
	}
	.count {
		font-size: 11.5px;
		color: var(--muted);
		text-align: right;
	}
	.complete {
		border-color: var(--done);
	}
	.complete .num {
		color: var(--done);
	}
</style>
