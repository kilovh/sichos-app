<script lang="ts">
	import { dev } from '$app/env';
	import { store } from '#lib/store.svelte.ts';

	const current = store.config;
	let owner = $state(current?.owner ?? '');
	let repo = $state(current?.repo ?? 'sichos-notes');
	let branch = $state(current?.branch ?? 'main');
	let token = $state('');
	let busy = $state(false);
	let message = $state('');

	async function connect(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		message = '';
		try {
			await store.saveConfig({ owner: owner.trim(), repo: repo.trim(), branch: branch.trim(), token: token.trim() || current!.token });
			message = 'Connected.';
			token = '';
		} catch (err) {
			message = `Couldn't connect: ${(err as Error).message}`;
		} finally {
			busy = false;
		}
	}

	const tokenUrl =
		'https://github.com/settings/personal-access-tokens/new?name=sichos-app&description=Read%20and%20write%20notes&contents=write';
</script>

<main class="page">
	<h1>Settings</h1>

	<section class="card">
		<h2 class="eyebrow">Notes repo</h2>
		{#if current}
			<p class="ui">Connected to <strong>{current.owner}/{current.repo}</strong> ({current.branch}).</p>
		{:else if dev}
			<p class="ui muted">In development, notes are read from and written to the local <code>../notes</code> folder.</p>
		{/if}
		<form class="ui" onsubmit={connect}>
			<label>Owner <input bind:value={owner} placeholder="your GitHub username" required /></label>
			<label>Repo <input bind:value={repo} required /></label>
			<label>Branch <input bind:value={branch} required /></label>
			<label>
				Token
				<input bind:value={token} type="password" placeholder={current ? '•••••• (unchanged)' : 'github_pat_…'} required={!current} autocomplete="off" />
			</label>
			<p class="muted help">
				Create a <a href={tokenUrl} target="_blank" rel="noopener">fine-grained token ↗</a> with access to
				<em>only</em> the notes repo and the permission <strong>Contents: Read and write</strong>. It stays on this
				device.
			</p>
			<div class="row">
				<button class="btn primary" disabled={busy}>{busy ? 'Checking…' : current ? 'Update' : 'Connect'}</button>
				{#if current}
					<button type="button" class="btn" onclick={() => store.saveConfig(null)}>Disconnect this device</button>
				{/if}
			</div>
			{#if message}<p class:error={message.startsWith("Couldn't")}>{message}</p>{/if}
		</form>
	</section>

	<section class="card ui">
		<h2 class="eyebrow">Sync</h2>
		<p>
			Status: {store.syncState}{store.lastSynced ? ` · last synced ${store.lastSynced}` : ''}{store.pending
				? ` · ${store.pending} change(s) waiting`
				: ''}
		</p>
		{#if store.syncMessage}<p class="error">{store.syncMessage}</p>{/if}
		<button class="btn" onclick={() => store.sync()}>Sync now</button>
	</section>

	<p class="ui muted credit">
		Catalog of Likkutei Sichos — volumes, pages, summaries and links — courtesy of
		<a href="https://mafteiach.app" target="_blank" rel="noopener">mafteiach.app</a>.
	</p>
</main>

<style>
	h1 {
		font-size: 32px;
		margin-bottom: 18px;
	}
	section {
		padding: 18px 20px;
		margin-bottom: 18px;
	}
	form {
		display: grid;
		gap: 10px;
		max-width: 460px;
	}
	label {
		display: grid;
		gap: 4px;
		color: var(--muted);
	}
	input {
		border: 1px solid var(--line);
		background: var(--bg);
		padding: 8px 10px;
		color: var(--ink);
	}
	input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.help {
		margin: 0;
		font-size: 13px;
	}
	a {
		color: var(--accent);
	}
	.row {
		display: flex;
		gap: 8px;
	}
	.error {
		color: var(--warn);
	}
	.credit {
		font-size: 13px;
	}
</style>
