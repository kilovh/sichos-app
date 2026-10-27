<script lang="ts">
	import type { Farbrengen, Sicha } from '#lib/catalog/types.ts';
	import { citation, volLabel } from '#lib/format.ts';
	import { hebrewNumeral, normalize } from '#lib/hebrew.ts';
	import { buildIndex } from '#lib/search.ts';
	import { store, tmDate } from '#lib/store.svelte.ts';

	let { onpick, onclose }: { onpick: (entry: Sicha | Farbrengen) => void; onclose: () => void } = $props();

	interface Item {
		entry: Sicha | Farbrengen;
		title: string;
		cite: string;
		summary?: string;
		heading?: string;
	}

	let scope = $state<'ls' | 'tm'>('ls');
	let q = $state('');
	/** Selected volume (LS) or year (TM). */
	let group = $state<number>();
	let active = $state(0);
	let input = $state<HTMLInputElement>();
	let list = $state<HTMLElement>();

	// Catalog only — notes aren't link targets here, and this keeps the indexes cheap to build.
	const lsSearch = $derived(buildIndex(store.catalog, {}));
	const tmSearch = $derived(buildIndex([], {}, store.tm));

	const lsItem = (s: Sicha): Item => ({ entry: s, title: s.title, cite: citation(s), summary: s.summary, heading: s.groups[0] });
	const tmItem = (f: Farbrengen): Item => ({ entry: f, title: f.title, cite: tmDate(f), heading: f.month });

	/** "15 34", "15:34", "15/34" → the sicha in volume 15 that page 34 falls in. */
	function byAddress(query: string): Sicha[] {
		const m = query.trim().match(/^(\d{1,2})\s*[\s:/,.]\s*(\d{1,4})$/);
		if (!m) return [];
		const [v, page] = [Number(m[1]), Number(m[2])];
		const inVol = (store.volumes.get(v) ?? []).filter((s) => s.page && s.page <= page);
		const hit = inVol.sort((a, b) => b.page! - a.page!)[0];
		return hit ? [hit] : [];
	}

	/** Search hits, with titles that start with the query (נח → נח, נח א…) first, in catalog order. */
	function ranked<T extends { id: string; title: string }>(
		hits: { ref: string }[],
		byId: Map<string, T>,
		order: (t: T) => number
	) {
		const nq = normalize(q.trim());
		return hits
			.map((h) => byId.get(h.ref))
			.filter((x): x is T => Boolean(x))
			.map((x, rank) => ({ x, rank, title: normalize(x.title).startsWith(nq) }))
			.sort((a, b) => Number(b.title) - Number(a.title) || (a.title ? order(a.x) - order(b.x) : a.rank - b.rank))
			.map((r) => r.x);
	}

	const items = $derived.by((): Item[] => {
		const query = q.trim();
		if (scope === 'ls') {
			if (!query) return group ? (store.volumes.get(group) ?? []).filter((s) => s.kind === 'sicha').map(lsItem) : [];
			const direct = byAddress(query);
			const found = ranked(lsSearch(query), store.byId, (s) => s.vol).filter((s) => !group || s.vol === group);
			return [...direct, ...found.filter((s) => !direct.includes(s))].slice(0, 40).map(lsItem);
		}
		if (!query) return group ? (store.tmYears.get(group) ?? []).map(tmItem) : [];
		return ranked(tmSearch(query), store.tmById, (f) => f.year)
			.filter((f) => !group || f.year === group)
			.slice(0, 40)
			.map(tmItem);
	});

	const groups = $derived(
		scope === 'ls'
			? [...store.volumes.keys()].map((v) => ({ key: v, label: hebrewNumeral(v) }))
			: [...store.tmYears].map(([y, e]) => ({ key: y, label: e[0].yearLabel }))
	);
	const browsing = $derived(!q.trim() && group !== undefined);

	$effect(() => {
		items;
		active = 0;
	});

	$effect(() => {
		input?.focus();
	});

	function setScope(s: typeof scope) {
		scope = s;
		group = undefined;
		input?.focus();
	}

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			const n = items.length;
			if (!n) return;
			active = (active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
			list?.querySelectorAll('button.result')[active]?.scrollIntoView({ block: 'nearest' });
		} else if (e.key === 'Enter' && items[active]) {
			e.preventDefault();
			onpick(items[active].entry);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onclose}></div>
<div class="picker card" role="dialog" aria-label="Link a sicha" tabindex="-1" onkeydown={keydown}>
	<div class="scopes" dir="rtl">
		<button class:on={scope === 'ls'} onclick={() => setScope('ls')}>ליקוטי שיחות</button>
		<button class:on={scope === 'tm'} onclick={() => setScope('tm')}>תורת מנחם</button>
	</div>
	<input
		bind:this={input}
		bind:value={q}
		class="q"
		dir="auto"
		placeholder={scope === 'ls' ? 'Search, or volume and page: 15 34' : 'Search an occasion: פורים, י"ט כסלו…'}
		autocomplete="off"
		spellcheck="false"
	/>
	<div class="groups ui" dir="rtl">
		{#each groups as g (g.key)}
			<button class:on={group === g.key} onclick={() => ((group = group === g.key ? undefined : g.key), input?.focus())}>
				{g.label}
			</button>
		{/each}
	</div>

	<div class="results" bind:this={list}>
		{#each items as item, i (item.entry.id)}
			{#if browsing && item.heading !== items[i - 1]?.heading}
				<p class="heading he" dir="rtl">{item.heading}</p>
			{/if}
			<button
				class="result he"
				class:active={i === active}
				dir="rtl"
				onmousemove={() => (active = i)}
				onclick={() => onpick(item.entry)}
			>
				<span class="title">{item.title}</span>
				<span class="cite">{item.cite}</span>
				<span class="marks ui">
					{#if store.isLearned(item.entry.id)}<span class="done" title="Learned">✓</span>{/if}
					{#if store.isFavorite(item.entry.id)}<span class="fav" title="Favorite">★</span>{/if}
				</span>
				{#if item.summary}<span class="summary">{item.summary}</span>{/if}
			</button>
		{:else}
			<p class="empty ui muted">
				{q.trim() ? 'No match.' : `Type to search, or pick a ${scope === 'ls' ? 'volume' : 'year'} above.`}
			</p>
		{/each}
	</div>
	<p class="foot ui muted">
		↑↓ to move · Enter to insert · Esc to close{scope === 'ls' && group ? ` · in ${volLabel(group)}` : ''} — the
		link is also copied
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
		border: 1px solid var(--ink);
		background: var(--bg);
		overflow: hidden;
	}
	.scopes,
	.q,
	.groups,
	.foot {
		flex: none;
	}
	.scopes {
		display: flex;
		gap: 4px;
		padding: 8px 10px 0;
		border-bottom: 1px solid var(--line);
	}
	.scopes button {
		border: 0;
		background: none;
		padding: 4px 10px 7px;
		margin-bottom: -1px;
		font: 500 15px var(--he);
		color: var(--muted);
		border-bottom: 2px solid transparent;
	}
	.scopes button.on {
		color: var(--ink);
		border-bottom-color: var(--red);
	}
	.q {
		border: 0;
		border-bottom: 1px solid var(--line);
		background: none;
		padding: 12px 16px;
		font: 19px var(--serif), var(--he);
	}
	.q:focus {
		outline: none;
	}
	.groups {
		display: flex;
		gap: 4px;
		padding: 8px 10px;
		overflow-x: auto;
		border-bottom: 1px solid var(--line);
		scrollbar-width: none;
	}
	.groups button {
		flex: none;
		border: 0;
		background: none;
		padding: 1px 5px;
		font: 15px var(--he);
		color: var(--muted);
	}
	.groups button:hover {
		color: var(--ink);
	}
	.groups button.on {
		color: var(--bg);
		background: var(--ink);
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
	.marks {
		display: flex;
		gap: 4px;
	}
	.done {
		color: var(--done);
	}
	.fav {
		color: var(--warn);
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
