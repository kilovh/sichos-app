<script lang="ts">
	import { resolve } from '$app/paths';
	import SichaRow from '#lib/components/SichaRow.svelte';
	import VolumeGrid from '#lib/components/VolumeGrid.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { store } from '#lib/store.svelte.ts';

	const all = $derived(store.progress(store.catalog));

	/** The first unlearned sicha after the one learned most recently. */
	const next = $derived.by(() => {
		const main = store.catalog.filter((s) => s.kind === 'sicha');
		const last = store
			.recent(50)
			.filter((n) => n.status === 'learned' && n.path.startsWith('ls/'))
			.at(0);
		const from = last ? main.findIndex((s) => `ls/${s.id}.md` === last.path) : -1;
		return [...main.slice(from + 1), ...main.slice(0, from + 1)].find((s) => !store.isLearned(s.id));
	});

	const recent = $derived(store.recent(6));
	const tmStars = $derived(store.tm.filter((f) => store.isFavorite(f.id)).length);
</script>

<main class="page">
	<section class="hero">
		<p class="eyebrow">Likkutei Sichos</p>
		<h1>
			<span class="big">{all.done}</span>
			<span class="muted">of {all.total.toLocaleString()} sichos learned</span>
		</h1>
		<div class="bar"><span style:width="{(100 * all.done) / (all.total || 1)}%"></span></div>
	</section>

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
						<a href={t.href}>
							<span class="he" dir="auto">{t.title}</span>
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
			<a class="ui muted" href={resolve('/browse')}>By parsha & moed →</a>
		</div>
		<VolumeGrid />
	</section>

	<section>
		<div class="head">
			<h2 class="eyebrow">Toras Menachem</h2>
			<a class="ui muted" href={resolve('/tm')}>{tmStars ? `${tmStars} favorites →` : 'Browse by year →'}</a>
		</div>
	</section>
</main>

<style>
	section {
		margin-bottom: 36px;
	}
	.hero h1 {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
		margin: 6px 0 14px;
		font-size: 22px;
	}
	.big {
		font-size: 56px;
		line-height: 1;
		font-weight: 400;
	}
	.hero .bar {
		height: 6px;
	}
	h2.eyebrow {
		margin-bottom: 8px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 8px;
	}
	.head h2 {
		margin: 0;
	}
	.recent {
		list-style: none;
		margin: 0;
		padding: 0;
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
		font-size: 18px;
	}
	.recent a:hover {
		color: var(--accent);
	}
	.cite {
		font-size: 14px;
	}
</style>
