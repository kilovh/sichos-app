<script lang="ts">
	import { resolve } from '$app/paths';
	import IgVolumes from '#lib/components/IgVolumes.svelte';
	import LetterJump from '#lib/components/LetterJump.svelte';
	import Star from '#lib/components/Star.svelte';
	import { igCite, store } from '#lib/store.svelte.ts';

	const favorites = $derived(store.igros.filter((l) => store.isFavorite(l.id)));
	const noted = $derived(store.igros.filter((l) => store.notes[`ig/${l.id}.md`]?.body.trim() && !store.isFavorite(l.id)));
</script>

<main class="page">
	<header class="he" dir="rtl">
		<p class="eyebrow">אגרות קודש</p>
		<h1>אגרות קודש</h1>
		<p class="ui muted" dir="ltr">
			{store.igros.length.toLocaleString()} letters in {store.igVolumes.size} volumes, each linked to its full text on
			Chabad Library.
		</p>
	</header>

	<section><LetterJump /></section>

	{#if favorites.length || noted.length}
		<section>
			<h2 class="eyebrow">Favorites & notes</h2>
			<ul class="list he" dir="rtl">
				{#each [...favorites, ...noted] as l (l.id)}
					<li>
						<a href={resolve('/l/[id]', { id: l.id })}>אגרת {l.numLabel}</a>
						<span class="muted cite">{igCite(l)}</span>
						<Star on={store.isFavorite(l.id)} size={16} label="Favorite" onclick={() => store.toggleFavorite(l.id)} />
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section>
		<h2 class="eyebrow">Volumes</h2>
		<IgVolumes />
	</section>
</main>

<style>
	header {
		margin-bottom: 22px;
	}
	h1 {
		font-size: 38px;
		margin: 4px 0 8px;
	}
	header p.ui {
		text-align: left;
		margin: 0;
	}
	section {
		margin-bottom: 34px;
	}
	h2.eyebrow {
		margin-bottom: 10px;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--line);
	}
	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 2px;
		border-bottom: 1px solid var(--line);
		font-size: 18px;
	}
	.list a:hover {
		color: var(--red);
	}
	.cite {
		font-size: 15px;
	}
	.list :global(.star) {
		margin-inline-start: auto;
	}
</style>
