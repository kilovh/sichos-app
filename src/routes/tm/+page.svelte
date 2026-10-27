<script lang="ts">
	import TmRow from '#lib/components/TmRow.svelte';
	import TmYears from '#lib/components/TmYears.svelte';
	import { store } from '#lib/store.svelte.ts';

	const favorites = $derived(store.tm.filter((f) => store.isFavorite(f.id)));
</script>

<main class="page">
	<header class="he" dir="rtl">
		<p class="eyebrow">תורת מנחם</p>
		<h1>התוועדויות ושיחות</h1>
		<p class="ui muted" dir="ltr">
			{store.tm.length.toLocaleString()} entries from Mafteiach's calendar, 5690–5752. Star the ones you love; each
			links to Mafteiach for its sources and summary.
		</p>
	</header>

	{#if favorites.length}
		<section>
			<h2 class="eyebrow">Favorites</h2>
			{#each favorites as f (f.id)}<TmRow entry={f} showYear />{/each}
		</section>
	{/if}

	<section>
		<h2 class="eyebrow">Years</h2>
		<TmYears />
	</section>
</main>

<style>
	header {
		margin-bottom: 24px;
	}
	h1 {
		font-size: 36px;
		margin: 4px 0 8px;
	}
	header p.ui {
		text-align: left;
		margin: 0;
	}
	section {
		margin-bottom: 32px;
	}
	h2.eyebrow {
		margin-bottom: 8px;
	}
</style>
