<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Sicha } from '#lib/catalog/types.ts';
	import { volLabel } from '#lib/format.ts';
	import { store } from '#lib/store.svelte.ts';
	import SichaRow from './SichaRow.svelte';

	let { title, sichos }: { title: string; sichos: Sicha[] } = $props();

	const prog = $derived(store.progress(sichos));
	const byVol = $derived.by(() => {
		const m = new Map<number, Sicha[]>();
		for (const s of sichos) m.set(s.vol, [...(m.get(s.vol) ?? []), s]);
		return [...m];
	});
</script>

<main class="page">
	<header dir="rtl" class="he">
		<h1>{title}</h1>
		<div class="progress" dir="ltr">
			<div class="bar"><span style:width="{(100 * prog.done) / (prog.total || 1)}%"></span></div>
			<span class="ui muted">{prog.done} / {prog.total}</span>
		</div>
	</header>

	{#each byVol as [vol, list] (vol)}
		<section>
			<h2 class="he" dir="rtl"><a href={resolve('/vol/[n]', { n: String(vol) })}>{volLabel(vol)}</a></h2>
			{#each list as s (s.id)}<SichaRow sicha={s} />{/each}
		</section>
	{:else}
		<p class="muted ui">Nothing here.</p>
	{/each}
</main>

<style>
	header {
		margin-bottom: 12px;
	}
	h1 {
		font-size: 36px;
		margin-bottom: 12px;
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.progress .bar {
		flex: 1;
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
	h2 a:hover {
		color: var(--accent);
	}
</style>
