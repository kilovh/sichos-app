<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { parshiyosOf } from '#lib/catalog/parshiyos.ts';
	import Check from '#lib/components/Check.svelte';
	import NoteEditor from '#lib/components/NoteEditor.svelte';
	import { citation, prettyDate, volLabel } from '#lib/format.ts';
	import { hebrewNumeral } from '#lib/hebrew.ts';
	import type { Note, Section, Status } from '#lib/notes/note.ts';
	import { store, today } from '#lib/store.svelte.ts';

	const id = $derived(page.params.id ?? '');
	const sicha = $derived(store.byId.get(id));
	const note = $derived(store.note(id));
	const learned = $derived(note.status === 'learned');

	const siblings = $derived(sicha ? (store.volumes.get(sicha.vol) ?? []) : []);
	const index = $derived(siblings.findIndex((s) => s.id === id));
	const prev = $derived(siblings[index - 1]);
	const next = $derived(siblings[index + 1]);
	const mentions = $derived(store.backlinks.get(id) ?? []);

	const save = (patch: Partial<Note>, message: string) => store.save({ ...note, ...patch }, message);

	function setStatus(status: Status | undefined) {
		save({ status: note.status === status ? undefined : status }, `${status ?? 'clear status'} ${id}`);
	}

	function learnAgain() {
		save({ status: 'learned', learned: [...note.learned, today()] }, `learned ${id} again`);
	}

	// Sections: off until switched on; then a small checklist inside the sicha.
	let newSection = $state('');
	const sections = $derived(note.sections ?? []);
	const setSections = (s: Section[] | undefined, msg: string) => save({ sections: s }, `${msg} ${id}`);
	function addSection(name = newSection.trim()) {
		if (!name || sections.some((s) => s.name === name)) return;
		setSections([...sections, { name, done: false }], 'add section');
		newSection = '';
	}
	function quickSections(n: number) {
		setSections(
			Array.from({ length: n }, (_, i) => ({ name: hebrewNumeral(i + 1).replace(/['"]/g, ''), done: false })),
			'add sections'
		);
	}

	let copied = $state(false);
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(`[[${id}]]`);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {}
	}

	let newTag = $state('');
	function addTag() {
		const t = newTag.trim();
		if (t && !note.tags.includes(t)) save({ tags: [...note.tags, t] }, `tag ${id}`);
		newTag = '';
	}


</script>

{#if !sicha}
	<main class="page muted ui">{store.catalog.length ? `No sicha "${id}".` : 'Loading…'}</main>
{:else}
	<main class="page">
		<nav class="crumbs ui he" dir="rtl">
			<a href={resolve('/vol/[n]', { n: String(sicha.vol) })}>{volLabel(sicha.vol)}</a>
			{#each sicha.groups as g (g)}
				<span>·</span>
				{@const p = parshiyosOf(g)[0]}
				<a href={p ? resolve('/parsha/[name]', { name: p }) : resolve('/group/[name]', { name: g })}>{g}</a>
			{/each}
		</nav>

		<header dir="rtl">
			<div class="title-row">
				<Check checked={learned} size={30} label="Learned" onclick={() => store.toggleLearned(id)} />
				<h1 class="he">{sicha.title}</h1>
			</div>
			<p class="cite he">
				ליקוטי שיחות {citation(sicha)}
				{#if sicha.kind === 'hosafa'}<span class="chip ui" dir="ltr">addition</span>{/if}
				<button class="copy ui" dir="ltr" onclick={copyLink} title="Copy a link to paste into any note">
					{copied ? 'Copied' : `[[${id}]]`}
				</button>
			</p>
		</header>

		<div class="status ui">
			{#if note.learned.length}
				<span class="muted">Learned {note.learned.map(prettyDate).join(' · ')}</span>
				<button class="link" onclick={learnAgain} disabled={note.learned.includes(today())}>Learned again today</button>
			{:else}
				<span class="muted">Not learned yet</span>
			{/if}
			<span class="spacer"></span>
			<button class="btn" class:on={note.status === 'in-progress'} onclick={() => setStatus('in-progress')}>In progress</button>
			<button class="btn" class:on={note.status === 'revisit'} onclick={() => setStatus('revisit')}>Revisit</button>
		</div>

		<div class="links ui">
			{#if sicha.links.pdf}<a class="btn primary" href={sicha.links.pdf} target="_blank" rel="noopener">Open sicha ↗</a>{/if}
			{#if sicha.links.translation}<a class="btn" href={sicha.links.translation} target="_blank" rel="noopener">Translation ↗</a>{/if}
			{#if sicha.links.chabadlibrary}<a class="btn" href={sicha.links.chabadlibrary} target="_blank" rel="noopener">Chabad Library ↗</a>{/if}
			{#if sicha.links.mafteiach}<a class="btn" href={sicha.links.mafteiach} target="_blank" rel="noopener">Kitzur on Mafteiach ↗</a>{/if}
		</div>

		{#if sicha.summary}
			<section class="summary card">
				<p class="eyebrow">Summary · Mafteiach</p>
				<p class="he bidi">{sicha.summary}</p>
			</section>
		{/if}

		<section>
			<div class="section-head">
				<h2 class="eyebrow">Sections</h2>
				{#if note.sections}
					<button class="link ui" onclick={() => setSections(undefined, 'stop tracking sections')}>Stop tracking</button>
				{:else}
					<button class="link ui" onclick={() => setSections([], 'track sections')}>Track sections</button>
				{/if}
			</div>
			{#if note.sections}
				{#if !sections.length}
					<p class="ui muted quick">
						Quick start:
						{#each [3, 4, 5, 6, 8] as n (n)}<button class="link" onclick={() => quickSections(n)}>{n} סעיפים</button>{/each}
						— or add your own (footnotes, ביאור, …) below.
					</p>
				{/if}
				<ul class="sections" dir="rtl">
					{#each sections as s, i (s.name)}
						<li>
							<Check
								checked={s.done}
								size={18}
								label="Section {s.name}"
								onclick={() => setSections(sections.map((x, j) => (j === i ? { ...x, done: !x.done } : x)), 'section')}
							/>
							<span class="he">{s.name}</span>
							<button
								class="remove ui"
								aria-label="Remove section {s.name}"
								onclick={() => setSections(sections.filter((_, j) => j !== i), 'remove section')}>×</button
							>
						</li>
					{/each}
				</ul>
				<form class="add ui" onsubmit={(e) => (e.preventDefault(), addSection())}>
					<input bind:value={newSection} placeholder="Add a section" dir="auto" />
				</form>
			{/if}
		</section>

		<section>
			<h2 class="eyebrow">Notes</h2>
			<NoteEditor {note} onsave={(body) => save({ body }, `note on ${id}`)} />
		</section>

		<section>
			<h2 class="eyebrow">Tags</h2>
			<div class="tags">
				{#each note.tags as t (t)}
					<span class="chip">
						<span dir="auto">{t}</span>
						<button class="remove" aria-label="Remove tag {t}" onclick={() => save({ tags: note.tags.filter((x) => x !== t) }, `untag ${id}`)}>×</button>
					</span>
				{/each}
				{#each note.auto_tags.filter((t) => !note.tags.includes(t)) as t (t)}
					<span class="chip auto" title="Added automatically"><span dir="auto">{t}</span></span>
				{/each}
				<form class="ui" onsubmit={(e) => (e.preventDefault(), addTag())}>
					<input bind:value={newTag} placeholder="+ tag" dir="auto" size="8" />
				</form>
			</div>
			{#if !note.auto_tags.length && note.body.trim()}
				<p class="ui muted small">Topic tags are added automatically after your notes sync.</p>
			{/if}
		</section>

		{#if mentions.length}
			<section>
				<h2 class="eyebrow">Mentioned in</h2>
				<ul class="mentions">
					{#each mentions as path (path)}
						{@const t = store.labelOfPath(path)}
						<li><a href={t.href} class="he" dir="auto">{t.title}{t.cite ? ` · ${t.cite}` : ''}</a></li>
					{/each}
				</ul>
			</section>
		{/if}

		<nav class="pager ui he" dir="rtl">
			{#if prev}<a href={resolve('/s/[id]', { id: prev.id })}>→ {prev.title}</a>{:else}<span></span>{/if}
			{#if next}<a href={resolve('/s/[id]', { id: next.id })}>{next.title} ←</a>{/if}
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
		color: var(--accent);
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	h1 {
		font-size: 42px;
		line-height: 1.1;
	}
	.cite {
		margin: 6px 0 0;
		color: var(--muted);
		font-size: 17px;
	}
	.copy {
		margin-inline-start: 8px;
		border: 1px dashed var(--line);
		background: none;
		border-radius: 6px;
		padding: 1px 7px;
		font-size: 12px;
		color: var(--muted);
		vertical-align: middle;
	}
	.copy:hover {
		color: var(--accent);
		border-color: var(--accent);
	}
	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
		margin: 18px 0 14px;
	}
	.spacer {
		flex: 1;
	}
	.btn.on {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		color: var(--accent);
		font: 14px var(--sans);
	}
	.link:disabled {
		color: var(--faint);
		cursor: default;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 22px;
	}
	section {
		margin-bottom: 28px;
	}
	h2.eyebrow,
	.summary .eyebrow {
		margin: 0 0 8px;
	}
	.summary {
		padding: 14px 18px;
	}
	.summary p.he {
		margin: 0;
		font-size: 17.5px;
		line-height: 1.7;
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 10px;
		margin: 0 0 8px;
	}
	.sections {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.sections li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		font-size: 17px;
	}
	.remove {
		border: 0;
		background: none;
		padding: 0 2px;
		color: var(--faint);
		font-size: 15px;
		line-height: 1;
	}
	.remove:hover {
		color: var(--warn);
	}
	.add {
		margin-top: 8px;
	}
	input {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		padding: 6px 10px;
		font-size: 14px;
	}
	input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.tags input {
		border-style: dashed;
		padding: 2px 10px;
		border-radius: 999px;
		font-size: 12.5px;
	}
	.small {
		font-size: 12.5px;
		margin: 8px 0 0;
	}
	.mentions {
		margin: 0;
		padding-inline-start: 18px;
	}
	.mentions a {
		color: var(--accent);
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
		color: var(--accent);
	}
</style>
