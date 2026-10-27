<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Sicha } from '#lib/catalog/types.ts';
	import { citation } from '#lib/format.ts';
	import { store } from '#lib/store.svelte.ts';
	import Check from './Check.svelte';

	let { sicha, showVolume = false }: { sicha: Sicha; showVolume?: boolean } = $props();

	const note = $derived(store.notes[`ls/${sicha.id}.md`]);
	const learned = $derived(note?.status === 'learned');
	const hasNote = $derived(Boolean(note?.body.trim()));
</script>

<a class="row he" dir="rtl" href={resolve('/s/[id]', { id: sicha.id })} class:learned>
	<Check checked={learned} label="Mark {sicha.title} learned" onclick={() => store.toggleLearned(sicha.id)} />
	<div class="main">
		<div class="line">
			<span class="title">{sicha.title}</span>
			{#if note?.status && note.status !== 'learned'}
				<span class="state ui" dir="ltr">{note.status === 'revisit' ? 'revisit' : 'in progress'}</span>
			{/if}
			{#if hasNote}<span class="noted" title="Has notes">✎</span>{/if}
			<span class="cite">{showVolume ? citation(sicha) : sicha.page ? `ע' ${sicha.page}` : ''}</span>
		</div>
		{#if sicha.summary}
			<p class="summary">{sicha.summary}</p>
		{/if}
	</div>
</a>

<style>
	.row {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 12px 4px;
		border-bottom: 1px solid var(--line);
	}
	.row:hover .title {
		color: var(--accent);
	}
	.row :global(.check) {
		margin-top: 3px;
	}
	.main {
		flex: 1;
		min-width: 0;
	}
	.line {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}
	.title {
		font-size: 19px;
		font-weight: 500;
	}
	.cite {
		margin-inline-start: auto;
		color: var(--faint);
		font-size: 14px;
	}
	.state {
		font-size: 13px;
		font-style: italic;
		color: var(--red);
	}
	.noted {
		color: var(--muted);
		font-size: 13px;
	}
	.summary {
		margin: 2px 0 0;
		font-size: 15px;
		line-height: 1.5;
		color: var(--muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.learned .summary {
		opacity: 0.7;
	}
</style>
