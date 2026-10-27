<script lang="ts">
	import type { Sicha } from '#lib/catalog/types.ts';
	import { runs } from '#lib/catalog/views.ts';
	import { citation, volLabel } from '#lib/format.ts';
	import { hebrewNumeral, normalize } from '#lib/hebrew.ts';
	import { buildIndex } from '#lib/search.ts';
	import { store } from '#lib/store.svelte.ts';

	let { onpick, onclose }: { onpick: (s: Sicha) => void; onclose: () => void } = $props();

	let q = $state('');
	let vol = $state<number>();
	let active = $state(0);
	let input = $state<HTMLInputElement>();
	let list = $state<HTMLElement>();

	// Catalog only — notes aren't link targets here, and this keeps the index cheap to build.
	const search = $derived(buildIndex(store.catalog, {}));

	/** "15 34", "15:34", "15/34" → the sicha in volume 15 that page 34 falls in. */
	function byAddress(query: string): Sicha[] {
		const m = query.trim().match(/^(\d{1,2})\s*[\s:/,.]\s*(\d{1,3})$/);
		if (!m) return [];
		const [v, page] = [Number(m[1]), Number(m[2])];
		const inVol = (store.volumes.get(v) ?? []).filter((s) => s.page && s.page <= page);
		const hit = inVol.sort((a, b) => b.page! - a.page!)[0];
		return hit ? [hit] : [];
	}

	const results = $derived.by((): Sicha[] => {
		const query = q.trim();
		if (!query) return vol ? (store.volumes.get(vol) ?? []).filter((s) => s.kind === 'sicha') : [];
		const direct = byAddress(query);
		// Titles that start with the query (נח → נח, נח א, נח ב…) come first, in volume order.
		const nq = normalize(query);
		const found = search(query)
			.map((h) => store.byId.get(h.ref))
			.filter((s): s is Sicha => Boolean(s) && (!vol || s!.vol === vol))
			.map((s, rank) => ({ s, rank, title: normalize(s.title).startsWith(nq) }))
			.sort((a, b) => Number(b.title) - Number(a.title) || (a.title ? a.s.vol - b.s.vol : a.rank - b.rank))
			.map((x) => x.s);
		return [...direct, ...found.filter((s) => !direct.includes(s))].slice(0, 40);
	});

	$effect(() => {
		results;
		active = 0;
	});

	$effect(() => {
		input?.focus();
	});

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			const n = results.length;
			if (!n) return;
			active = (active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
			list?.querySelectorAll('button.result')[active]?.scrollIntoView({ block: 'nearest' });
		} else if (e.key === 'Enter' && results[active]) {
			e.preventDefault();
			onpick(results[active]);
		}
	}

	const grouped = $derived(!q.trim() && vol ? runs(results) : null);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onclose}></div>
<div class="picker card" role="dialog" aria-label="Link a sicha" tabindex="-1" onkeydown={keydown}>
	<input
		bind:this={input}
		bind:value={q}
		class="q"
		dir="auto"
		placeholder="Search, or volume and page: 15 34"
		autocomplete="off"
		spellcheck="false"
	/>
	<div class="vols ui" dir="rtl">
		{#each [...store.volumes.keys()] as v (v)}
			<button class:on={vol === v} onclick={() => ((vol = vol === v ? undefined : v), input?.focus())}>
				{hebrewNumeral(v)}
			</button>
		{/each}
	</div>

	<div class="results" bind:this={list}>
		{#snippet row(s: Sicha, i: number)}
			<button
				class="result he"
				class:active={i === active}
				dir="rtl"
				onmousemove={() => (active = i)}
				onclick={() => onpick(s)}
			>
				<span class="title">{s.title}</span>
				<span class="cite">{citation(s)}</span>
				{#if store.isLearned(s.id)}<span class="done ui" title="Learned">✓</span>{/if}
				{#if s.summary}<span class="summary">{s.summary}</span>{/if}
			</button>
		{/snippet}

		{#if grouped}
			{@const flat = results}
			{#each grouped as run, r (r)}
				<p class="heading he" dir="rtl">{run.heading}</p>
				{#each run.sichos as s (s.id)}{@render row(s, flat.indexOf(s))}{/each}
			{/each}
		{:else if results.length}
			{#each results as s, i (s.id)}{@render row(s, i)}{/each}
		{:else}
			<p class="empty ui muted">
				{q.trim() ? 'No match.' : 'Type to search titles and summaries, or pick a volume above.'}
			</p>
		{/if}
	</div>
	<p class="foot ui muted">
		↑↓ to move · Enter to insert · Esc to close{vol ? ` · in ${volLabel(vol)}` : ''} — the link is also copied
	</p>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--ink) 18%, transparent);
	}
	.picker {
		position: fixed;
		z-index: 41;
		top: max(8vh, env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		width: min(640px, calc(100vw - 2 * var(--gutter)));
		max-height: min(78vh, 720px);
		display: flex;
		flex-direction: column;
		box-shadow: 0 18px 50px rgb(0 0 0 / 0.18);
		overflow: hidden;
	}
	.q,
	.vols,
	.foot {
		flex: none;
	}
	.q {
		border: 0;
		border-bottom: 1px solid var(--line);
		background: none;
		padding: 14px 16px;
		font: 19px var(--serif), var(--he);
	}
	.q:focus {
		outline: none;
	}
	.vols {
		display: flex;
		gap: 4px;
		padding: 8px 10px;
		overflow-x: auto;
		border-bottom: 1px solid var(--line);
		scrollbar-width: none;
	}
	.vols button {
		flex: none;
		border: 1px solid var(--line);
		background: none;
		border-radius: 6px;
		padding: 2px 7px;
		font: 14px var(--he);
		color: var(--muted);
	}
	.vols button.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--bg);
	}
	.results {
		overflow-y: auto;
		padding: 4px 0;
	}
	.result {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: baseline;
		gap: 2px 10px;
		width: 100%;
		border: 0;
		background: none;
		padding: 8px 16px;
		text-align: start;
	}
	.result.active {
		background: var(--accent-soft);
	}
	.title {
		font-size: 17.5px;
		font-weight: 500;
	}
	.cite {
		color: var(--faint);
		font-size: 14px;
	}
	.done {
		color: var(--done);
	}
	.summary {
		grid-column: 1 / -1;
		color: var(--muted);
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.heading {
		margin: 8px 16px 2px;
		font-size: 13px;
		color: var(--muted);
	}
	.empty {
		padding: 16px;
		margin: 0;
	}
	.foot {
		margin: 0;
		padding: 8px 16px;
		border-top: 1px solid var(--line);
		font-size: 12px;
	}
	@media (max-width: 640px) {
		.picker {
			top: calc(8px + env(safe-area-inset-top));
			max-height: 60vh;
		}
	}
</style>
