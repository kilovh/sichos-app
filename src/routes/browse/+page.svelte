<script lang="ts">
	import { resolve } from '$app/paths';
	import { SEFARIM } from '#lib/catalog/parshiyos.ts';
	import { byOtherHeading, byParsha } from '#lib/catalog/views.ts';
	import VolumeGrid from '#lib/components/VolumeGrid.svelte';
	import { store } from '#lib/store.svelte.ts';

	const parshiyos = $derived(byParsha(store.catalog));
	const other = $derived(byOtherHeading(store.catalog));
</script>

<main class="page">
	<section>
		<h1 class="eyebrow">Volumes</h1>
		<VolumeGrid />
	</section>

	<section>
		<h1 class="eyebrow">Parshiyos</h1>
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
		<h1 class="eyebrow">Moadim & other</h1>
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
</main>

<style>
	section {
		margin-bottom: 40px;
	}
	h1.eyebrow {
		margin-bottom: 12px;
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
		gap: 8px;
	}
	.other a {
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
		padding: 4px 12px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		font-size: 16px;
	}
</style>
