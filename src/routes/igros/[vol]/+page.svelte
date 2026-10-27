<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import LetterJump from '#lib/components/LetterJump.svelte';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { store } from '#lib/store.svelte.ts';

	const vol = $derived(Number(page.params.vol));
	const letters = $derived(store.igVolumes.get(vol) ?? []);
	const vols = $derived([...store.igVolumes.keys()]);
</script>

<main class="page">
	<nav class="pager ui he" dir="rtl">
		{#if vols.includes(vol - 1)}<a href={resolve('/igros/[vol]', { vol: String(vol - 1) })}>→ כרך {hebrewNumeral(vol - 1)}</a>{:else}<span></span>{/if}
		<a href={resolve('/igros')}>כל הכרכים</a>
		{#if vols.includes(vol + 1)}<a href={resolve('/igros/[vol]', { vol: String(vol + 1) })}>כרך {hebrewNumeral(vol + 1)} ←</a>{:else}<span></span>{/if}
	</nav>

	<header class="he" dir="rtl">
		<p class="eyebrow">אגרות קודש</p>
		<h1>כרך {hebrewNumeral(vol)}</h1>
		{#if letters.length}
			<p class="ui muted" dir="ltr">Letters {letters[0].num.toLocaleString()}–{letters.at(-1)!.num.toLocaleString()}</p>
		{/if}
	</header>

	<section><LetterJump /></section>

	<!-- One square per letter: solid when learned, a gold mark when starred, a dot when it has notes. -->
	<div class="grid he" dir="rtl">
		{#each letters as l (l.id)}
			{@const n = store.notes[`ig/${l.id}.md`]}
			<a
				class="cell"
				class:learned={n?.status === 'learned'}
				class:fav={n?.favorite}
				class:noted={n?.body.trim()}
				href={resolve('/l/[id]', { id: l.id })}
				title="Letter {l.num}"
			>
				<span class="he-num">{l.numLabel}</span>
				<span class="ar-num ui" dir="ltr">{l.num}</span>
			</a>
		{:else}
			<p class="ui muted">{store.igros.length ? 'No such volume.' : 'Loading…'}</p>
		{/each}
	</div>
</main>

<style>
	.pager {
		display: flex;
		justify-content: space-between;
		color: var(--muted);
		margin-bottom: 18px;
		font-size: 16px;
	}
	.pager a:hover {
		color: var(--red);
	}
	header {
		margin-bottom: 18px;
	}
	h1 {
		font-size: 38px;
		margin: 4px 0 6px;
	}
	header p.ui {
		text-align: left;
		margin: 0;
	}
	section {
		margin-bottom: 22px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(58px, 1fr));
		gap: 1px;
		padding: 1px;
	}
	.cell {
		position: relative;
		box-shadow: 0 0 0 1px var(--line);
		display: grid;
		place-items: center;
		padding: 8px 2px 6px;
		background: var(--bg);
		line-height: 1.1;
	}
	.cell:hover {
		outline: 1px solid var(--ink);
		outline-offset: -1px;
		z-index: 1;
	}
	.he-num {
		font-size: 15px;
	}
	.ar-num {
		font-size: 10px;
		color: var(--faint);
	}
	.learned {
		background: var(--ink);
		color: var(--bg);
	}
	.learned .ar-num {
		color: color-mix(in srgb, var(--bg) 65%, transparent);
	}
	.fav::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		border-top: 9px solid var(--gold);
		border-right: 9px solid transparent;
	}
	.noted::before {
		content: '';
		position: absolute;
		bottom: 4px;
		right: 4px;
		width: 4px;
		height: 4px;
		background: var(--red);
	}
</style>
