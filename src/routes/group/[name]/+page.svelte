<script lang="ts">
	import { page } from '$app/state';
	import SichaList from '#lib/components/SichaList.svelte';
	import { store } from '#lib/store.svelte.ts';

	const name = $derived(page.params.name ?? '');
	const sichos = $derived(store.catalog.filter((s) => s.kind === 'sicha' && s.groups.includes(name)));
</script>

<SichaList title={name} {sichos} />
