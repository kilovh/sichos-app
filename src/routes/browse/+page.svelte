<script lang="ts">
	import { resolve } from '$app/paths';
	import { SEFARIM } from '#lib/catalog/parshiyos.ts';
	import { byOtherHeading, byParsha } from '#lib/catalog/views.ts';
	import IgVolumes from '#lib/components/IgVolumes.svelte';
	import TmYears from '#lib/components/TmYears.svelte';
	import VolumeGrid from '#lib/components/VolumeGrid.svelte';
	import { store } from '#lib/store.svelte.ts';

	const parshiyos = $derived(byParsha(store.catalog));
	const other = $derived(byOtherHeading(store.catalog));
</script>

<main class="page">
	<section>
		<h1 class="eyebrow">Likkutei Sichos · by volume</h1>
		<VolumeGrid />
	</section>

	<section>
		<h1 class="eyebrow">Likkutei Sichos · by parsha</h1>
		<div class="sefarim he" dir="rtl">
			{#each SEFARIM as sefer (sefer.name)}
				<div>
					<h2>{sefer.name}</h2>
					<ul>
						{#each sefer.parshiyos as p (p)}
							{@const list = parshiyos.get(p) ?? []}
							{@const prog = store.progress(list)}
							<li>
								<a href={resolve('/parsha/[name]', { name: p })}>
									<span>{p}</span>
									<span class="ui count" dir="ltr">{prog.done ? `${prog.done}/` : ''}{prog.total}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h1 class="eyebrow">Likkutei Sichos · moadim & other</h1>
		<ul class="other he" dir="rtl">
			{#each other as [heading, list] (heading)}
				<li>
					<a href={resolve('/group/[name]', { name: heading })}>
						{heading}
						<span class="ui count">{list.length}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<div class="head">
			<h1 class="eyebrow">Toras Menachem · by year</h1>
			<a class="ui muted" href={resolve('/tm')}>Favorites →</a>
		</div>
		<TmYears />
	</section>

	<section>
		<div class="head">
			<h1 class="eyebrow">Igros Kodesh · by volume</h1>
			<a class="ui muted" href={resolve('/igros')}>Find a letter →</a>
		</div>
		<IgVolumes />
	</section>

</main>

<style>
	section {
		margin-bottom: 40px;
	}
	h1.eyebrow {
		margin-bottom: 12px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.sefarim {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 20px 16px;
	}
	h2 {
		font-size: 15px;
		color: var(--muted);
		margin-bottom: 6px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.sefarim a {
		display: flex;
		justify-content: space-between;
		padding: 3px 0;
		font-size: 17.5px;
	}
	a:hover {
		color: var(--accent);
	}
	.count {
		color: var(--faint);
		font-size: 12px;
	}
	.other {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 22px;
		border-top: 1px solid var(--line);
		padding-top: 12px;
	}
	.other a {
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
		font-size: 18px;
	}
</style>
