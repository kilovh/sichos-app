<script lang="ts">
	import { resolve } from '$app/paths';
	import SichaRow from '#lib/components/SichaRow.svelte';
	import TmYears from '#lib/components/TmYears.svelte';
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
	const igStars = $derived(store.igros.filter((l) => store.isFavorite(l.id)).length);
</script>

<main class="page">
	<header class="hero">
		<p class="kicker he">ליקוטי שיחות</p>
		<p class="count">
			<span class="big">{all.done.toLocaleString()}</span>
			<span class="of">of {all.total.toLocaleString()} sichos learned</span>
		</p>
		<div class="bar"><span style:width="{(100 * all.done) / (all.total || 1)}%"></span></div>
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

	<section>
		<div class="head">
			<h2 class="eyebrow">Toras Menachem</h2>
			<a class="more ui" href={resolve('/tm')}>{tmStars ? `${tmStars} favorites →` : 'Browse by year →'}</a>
		</div>
		<TmYears />
	</section>

	<section>
		<div class="head">
			<h2 class="eyebrow">Igros Kodesh</h2>
			<a class="more ui" href={resolve('/igros')}>{igStars ? `${igStars} favorites →` : 'Find a letter →'}</a>
		</div>
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
