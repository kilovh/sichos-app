<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Farbrengen } from '#lib/catalog/types.ts';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { store, tmDate } from '#lib/store.svelte.ts';
	import Check from './Check.svelte';
	import Star from './Star.svelte';

	let { entry, showYear = false }: { entry: Farbrengen; showYear?: boolean } = $props();

	const note = $derived(store.notes[`tm/${entry.id}.md`]);
	const learned = $derived(note?.status === 'learned');
</script>

<a class="row he" dir="rtl" href={resolve('/t/[id]', { id: entry.id })} class:learned>
	<Check checked={learned} size={20} label="Mark learned" onclick={() => store.toggleLearned(entry.id)} />
	<span class="day">{showYear ? tmDate(entry) : entry.day ? hebrewNumeral(entry.day) : '—'}</span>
	<span class="title">{entry.title}</span>
	{#if note?.body.trim()}<span class="noted" title="Has notes">✎</span>{/if}
	<Star on={Boolean(note?.favorite)} size={18} label="Favorite" onclick={() => store.toggleFavorite(entry.id)} />
</a>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 4px;
		border-bottom: 1px solid var(--line);
	}
	.row:hover .title {
		color: var(--accent);
	}
	.day {
		flex: none;
		min-width: 2.6em;
		color: var(--faint);
		font-size: 15px;
	}
	.title {
		flex: 1;
		font-size: 17.5px;
	}
	.noted {
		color: var(--muted);
		font-size: 13px;
	}
	.row :global(.star) {
		margin-inline-start: auto;
	}
</style>
