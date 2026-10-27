<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Check from '#lib/components/Check.svelte';
	import EntryNotes from '#lib/components/EntryNotes.svelte';
	import Star from '#lib/components/Star.svelte';
	import { prettyDate } from '#lib/format.ts';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import { igCite, store } from '#lib/store.svelte.ts';

	const id = $derived(page.params.id ?? '');
	const letter = $derived(store.igById.get(id));
	const note = $derived(store.note(id));

	const index = $derived(store.igros.findIndex((l) => l.id === id));
	const prev = $derived(store.igros[index - 1]);
	const next = $derived(store.igros[index + 1]);

	let copied = $state(false);
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(`[[${id}]]`);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}
</script>

{#if !letter}
	<main class="page muted ui">{store.igros.length ? `No letter "${id}".` : 'Loading…'}</main>
{:else}
	<main class="page">
		<nav class="crumbs ui he" dir="rtl">
			<a href={resolve('/igros')}>אגרות קודש</a>
			<span>·</span>
			<a href={resolve('/igros/[vol]', { vol: String(letter.vol) })}>כרך {hebrewNumeral(letter.vol)}</a>
			{#if letter.section}<span>·</span><span>{letter.section}</span>{/if}
		</nav>

		<header dir="rtl">
			<div class="title-row">
				<Check checked={store.isLearned(id)} size={26} label="Learned" onclick={() => store.toggleLearned(id)} />
				<h1 class="he">אגרת {letter.numLabel}</h1>
				<Star on={store.isFavorite(id)} size={26} label="Favorite" onclick={() => store.toggleFavorite(id)} />
			</div>
			<p class="cite he">
				{igCite(letter)} · <span class="ui" dir="ltr">letter {letter.num.toLocaleString()}</span>
				<button class="copy ui" dir="ltr" onclick={copyLink} title="Copy a link to paste into any note">
					{copied ? 'Copied' : `[[${id}]]`}
				</button>
			</p>
		</header>

		<div class="status ui">
			<span class="muted">{note.learned.length ? `Learned ${note.learned.map(prettyDate).join(' · ')}` : 'Not learned yet'}</span>
		</div>

		<div class="links ui">
			<a class="btn primary" href={letter.url} target="_blank" rel="noopener">Read on Chabad Library ↗</a>
		</div>

		<EntryNotes {id} />

		<nav class="pager ui he" dir="rtl">
			{#if prev}<a href={resolve('/l/[id]', { id: prev.id })}>→ אגרת {prev.numLabel}</a>{:else}<span></span>{/if}
			{#if next}<a href={resolve('/l/[id]', { id: next.id })}>אגרת {next.numLabel} ←</a>{/if}
		</nav>
	</main>
{/if}

<style>
	.crumbs {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		color: var(--muted);
		font-size: 15px;
		margin-bottom: 14px;
	}
	.crumbs a:hover {
		color: var(--red);
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	h1 {
		font-size: 40px;
		line-height: 1.1;
		flex: 1;
	}
	.cite {
		margin: 6px 0 0;
		color: var(--muted);
		font-size: 17px;
	}
	.copy {
		margin-inline-start: 10px;
		border: 0;
		background: none;
		padding: 0;
		font-size: 13px;
		font-style: italic;
		color: var(--faint);
	}
	.copy:hover {
		color: var(--red);
	}
	.status {
		margin: 16px 0 12px;
	}
	.links {
		margin-bottom: 26px;
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		color: var(--muted);
		font-size: 16px;
	}
	.pager a:hover {
		color: var(--red);
	}
</style>
