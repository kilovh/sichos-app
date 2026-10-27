<script lang="ts">
	// Home is Likkutei Sichos only; Toras Menachem and Igros live under Browse.
	import { resolve } from '$app/paths';
	import SichaRow from '#lib/components/SichaRow.svelte';
	import VolumeGrid from '#lib/components/VolumeGrid.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { store } from '#lib/store.svelte.ts';

	const all = $derived(store.progress(store.catalog));
	const additions = $derived(store.catalog.filter((s) => s.kind === 'hosafa').length);

	/** The first unlearned sicha after the one learned most recently. */
	const next = $derived.by(() => {
		const main = store.catalog.filter((s) => store.counts(s));
		const last = store.recent(50, 'ls/').find((n) => n.status === 'learned');
		const from = last ? main.findIndex((s) => `ls/${s.id}.md` === last.path) : -1;
		return [...main.slice(from + 1), ...main.slice(0, from + 1)].find((s) => !store.isLearned(s.id));
	});

	const recent = $derived(store.recent(6, 'ls/'));
</script>

<main class="page">
	<header class="hero">
		<p class="kicker he">ליקוטי שיחות</p>
		<p class="count">
			<span class="big">{all.done.toLocaleString()}</span>
			<span class="of">of {all.total.toLocaleString()} {store.countAdditions ? 'sichos & additions' : 'sichos'} learned</span>
		</p>
		<div class="bar"><span style:width="{(100 * all.done) / (all.total || 1)}%"></span></div>
		<p class="scope ui">
			{#if store.countAdditions}
				All 39 volumes, counting the {additions.toLocaleString()} הוספות (letters and additions) ·
				<button onclick={() => store.setCountAdditions(false)}>count sichos only</button>
			{:else}
				The sichos of all 39 volumes, not counting the {additions.toLocaleString()} הוספות ·
				<button onclick={() => store.setCountAdditions(true)}>count them too</button>
			{/if}
		</p>
	</header>

	{#if next}
		<section>
			<h2 class="eyebrow">Up next</h2>
			<SichaRow sicha={next} showVolume />
		</section>
	{/if}

	{#if recent.length}
		<section>
			<h2 class="eyebrow">Recently</h2>
			<ul class="recent">
				{#each recent as n (n.path)}
					{@const t = store.labelOfPath(n.path)}
					<li>
						<a href={t.href} dir="auto">
							<span class="he">{t.title}</span>
							{#if t.cite}<span class="he muted cite">{t.cite}</span>{/if}
						</a>
						{#if n.learned.length}<span class="ui muted">{prettyDate(n.learned.at(-1)!)}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section>
		<div class="head">
			<h2 class="eyebrow">Volumes</h2>
			<a class="more ui" href={resolve('/browse')}>By parsha & moed →</a>
		</div>
		<VolumeGrid />
	</section>
</main>

<style>
	.hero {
		margin: 8px 0 44px;
	}
	.kicker {
		margin: 0 0 6px;
		font-size: 17px;
		color: var(--muted);
	}
	.scope {
		margin: 10px 0 0;
		font-size: 13px;
		font-style: italic;
		color: var(--faint);
	}
	.scope button {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		color: var(--muted);
		text-decoration: underline;
		text-decoration-color: var(--line);
		text-underline-offset: 0.2em;
	}
	.scope button:hover {
		color: var(--red);
		text-decoration-color: var(--red);
	}
	.count {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 4px 14px;
		margin: 0 0 18px;
	}
	.big {
		font-size: 88px;
		line-height: 0.9;
		font-weight: 400;
		font-variant-numeric: lining-nums;
		letter-spacing: -0.03em;
		color: var(--red);
	}
	.of {
		font-size: 22px;
		font-style: italic;
		color: var(--muted);
	}
	section {
		margin-bottom: 44px;
	}
	h2.eyebrow {
		margin-bottom: 10px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 10px;
	}
	.head h2 {
		margin: 0;
	}
	.more {
		color: var(--muted);
		font-style: italic;
	}
	.more:hover {
		color: var(--red);
	}
	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.recent li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		padding: 9px 2px;
		border-bottom: 1px solid var(--line);
	}
	.recent a {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 19px;
	}
	.recent a:hover {
		color: var(--red);
	}
	.cite {
		font-size: 15px;
	}
</style>
