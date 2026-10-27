<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { runs } from '#lib/catalog/views.ts';
	import SichaRow from '#lib/components/SichaRow.svelte';
	import { volLabel } from '#lib/format.ts';
	import { store } from '#lib/store.svelte.ts';

	const vol = $derived(Number(page.params.n));
	const all = $derived(store.volumes.get(vol) ?? []);
	const main = $derived(runs(all.filter((s) => s.kind === 'sicha')));
	const additions = $derived(runs(all.filter((s) => s.kind === 'hosafa')));
	const prog = $derived(store.progress(all));
	let showAdditions = $state(false);
</script>

<main class="page">
	<nav class="pager ui">
		{#if vol > 1}<a href={resolve('/vol/[n]', { n: String(vol - 1) })}>← {volLabel(vol - 1)}</a>{:else}<span></span>{/if}
		{#if vol < 39}<a href={resolve('/vol/[n]', { n: String(vol + 1) })}>{volLabel(vol + 1)} →</a>{/if}
	</nav>

	<header dir="rtl" class="he">
		<p class="eyebrow">ליקוטי שיחות</p>
		<h1>{volLabel(vol)}</h1>
		<div class="progress" dir="ltr">
			<div class="bar"><span style:width="{(100 * prog.done) / (prog.total || 1)}%"></span></div>
			<span class="ui muted">{prog.done} / {prog.total}</span>
		</div>
	</header>

	{#each main as run, i (i)}
		<section>
			<h2 class="he" dir="rtl">{run.heading}</h2>
			{#each run.sichos as s (s.id)}<SichaRow sicha={s} />{/each}
		</section>
	{/each}

	{#if additions.length}
		<button class="btn toggle" onclick={() => (showAdditions = !showAdditions)}>
			{showAdditions ? 'Hide' : 'Show'} additions (הוספות) · {additions.reduce((n, r) => n + r.sichos.length, 0)}
		</button>
		{#if showAdditions}
			{#each additions as run, i (i)}
				<section>
					<h2 class="he" dir="rtl">{run.heading}</h2>
					{#each run.sichos as s (s.id)}<SichaRow sicha={s} />{/each}
				</section>
			{/each}
		{/if}
	{/if}
</main>

<style>
	.pager {
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		margin-bottom: 18px;
	}
	.pager a:hover {
		color: var(--accent);
	}
	header {
		margin-bottom: 20px;
	}
	h1 {
		font-size: 40px;
		margin: 4px 0 12px;
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
	.toggle {
		margin-top: 28px;
	}
</style>
