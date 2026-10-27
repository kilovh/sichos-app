<script lang="ts">
	import { page } from '$app/state';
	import { byParsha } from '#lib/catalog/views.ts';
	import SichaList from '#lib/components/SichaList.svelte';
	import { store } from '#lib/store.svelte.ts';

	const name = $derived(page.params.name ?? '');
	const sichos = $derived(byParsha(store.catalog).get(name) ?? []);
</script>

<SichaList title={`פרשת ${name}`} {sichos} />
