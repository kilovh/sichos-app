<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { slugify } from '#lib/format.ts';
	import { emptyNote, references } from '#lib/notes/note.ts';
	import { store, today } from '#lib/store.svelte.ts';
	import { WORKS, sourceLabel, type Source } from '#lib/notes/sources.ts';

	const thoughts = $derived(
		Object.values(store.notes)
			.filter((n) => n.path.startsWith('thoughts/'))
			.sort((a, b) => b.path.localeCompare(a.path))
	);
	const log = $derived(
		Object.values(store.notes)
			.filter((n) => n.path.startsWith('log/'))
			.sort((a, b) => b.path.localeCompare(a.path))
	);
	const withNotes = $derived(
		Object.values(store.notes).filter((n) => n.path.startsWith('ls/') && n.body.trim()).length
	);

	let title = $state('');
	function newThought(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		const path = `thoughts/${today()}-${slugify(title)}.md`;
		store.save({ ...emptyNote(path), title: title.trim() }, `new thought: ${title.trim()}`);
		goto(resolve('/notes/[...path]', { path: path.replace(/\.md$/, '') }));
	}

	let src = $state<Source>({ work: 'tm', vol: '', where: '', date: '' });
	let srcTitle = $state('');
	function logSource(e: SubmitEvent) {
		e.preventDefault();
		const label = sourceLabel(src);
		const path = `log/${today()}-${slugify(`${src.work}-${src.vol}-${src.where}`)}.md`;
		store.save(
			{ ...emptyNote(path), title: srcTitle.trim() || label, learned: [today()], extra: { source: { ...src } } },
			`log ${label}`
		);
		goto(resolve('/notes/[...path]', { path: path.replace(/\.md$/, '') }));
	}
</script>

<main class="page">
	<section>
		<h1 class="eyebrow">Thoughts</h1>
		<form class="new" onsubmit={newThought}>
			<input bind:value={title} placeholder="Start a new thought — a theme across sichos…" dir="auto" />
			<button class="btn primary">New</button>
		</form>
		<ul>
			{#each thoughts as n (n.path)}
				<li>
					<a href={resolve('/notes/[...path]', { path: n.path.replace(/\.md$/, '') })} dir="auto">{n.title ?? n.path}</a>
					<span class="ui muted">{references(n.body).length || ''}{references(n.body).length ? ' sichos' : ''}</span>
				</li>
			{:else}
				<li class="ui muted">None yet. A thought can link to any number of sichos with <code>[[ls-15-7]]</code>, and shows up on each of their pages.</li>
			{/each}
		</ul>
	</section>

	<section>
		<h1 class="eyebrow">Other sources</h1>
		<p class="ui muted lead">
			Toras Menachem and Igros Kodesh have their own indexes under <a href={resolve('/tm')}>Toras Menachem</a> and
			<a href={resolve('/igros')}>Igros</a>; use this for anything that isn't there.
		</p>
		<form class="source card ui" onsubmit={logSource}>
			<select bind:value={src.work}>
				{#each Object.entries(WORKS) as [k, w] (k)}<option value={k}>{w.name}</option>{/each}
			</select>
			<input bind:value={src.vol} placeholder={WORKS[src.work].volume} inputmode="numeric" size="5" />
			<input bind:value={src.where} placeholder={WORKS[src.work].where} size="7" />
			{#if src.work === 'tm'}<input bind:value={src.date} placeholder="date (e.g. י״ט כסלו תשי״ב)" dir="auto" size="18" />{/if}
			<input class="grow" bind:value={srcTitle} placeholder="what it's about (optional)" dir="auto" />
			<button class="btn primary" disabled={!src.vol && !src.date}>Log</button>
		</form>
		<ul>
			{#each log as n (n.path)}
				{@const s = n.extra.source as Source | undefined}
				<li>
					<a href={resolve('/notes/[...path]', { path: n.path.replace(/\.md$/, '') })} dir="auto">{n.title}</a>
					<span class="ui muted">{s ? sourceLabel(s) : ''}</span>
				</li>
			{:else}
				<li class="ui muted">Log a favorite sicha from Toras Menachem or a letter from Igros Kodesh.</li>
			{/each}
		</ul>
	</section>

	<p class="ui muted">{withNotes} Likkutei Sichos entries have notes — find them with Search → “with notes”.</p>
</main>

<style>
	section {
		margin-bottom: 40px;
	}
	h1.eyebrow {
		margin-bottom: 10px;
	}
	.lead {
		margin: 0 0 10px;
	}
	.lead a {
		color: var(--accent);
	}
	.new,
	.source {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 10px;
	}
	.source {
		padding: 10px;
	}
	input,
	select {
		border: 1px solid var(--line);
		background: var(--surface);
		padding: 7px 10px;
		font-size: 15px;
	}
	.new input,
	.grow {
		flex: 1;
		min-width: 160px;
	}
	input:focus,
	select:focus {
		outline: none;
		border-color: var(--accent);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 2px;
		border-bottom: 1px solid var(--line);
		font-size: 18px;
	}
	li a:hover {
		color: var(--accent);
	}
	li.ui {
		font-size: 14px;
	}
</style>
