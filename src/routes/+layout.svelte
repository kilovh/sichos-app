<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import { store } from '#lib/store.svelte.ts';
	import SyncBadge from '#lib/components/SyncBadge.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => store.init());

	const nav = [
		{ href: resolve('/'), label: 'Home', match: (p: string) => p === '/' },
		{ href: resolve('/browse'), label: 'Browse', match: (p: string) => /^\/(browse|vol|parsha|group|tm|t\/)/.test(p) },
		{ href: resolve('/search'), label: 'Search', match: (p: string) => p.startsWith('/search') },
		{ href: resolve('/notes'), label: 'Notes', match: (p: string) => p.startsWith('/notes') }
	];
	const path = $derived(page.route.id ?? '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="top ui">
	<a href={resolve('/')} class="brand">
		<span class="he">ליקוטי שיחות</span>
	</a>
	<nav class="desktop">
		{#each nav as item (item.href)}
			<a href={item.href} class:active={item.match(path)}>{item.label}</a>
		{/each}
	</nav>
	<SyncBadge />
</header>

{#if store.ready && store.syncState === 'unconfigured' && !path.startsWith('/settings')}
	<div class="page">
		<div class="card connect">
			<h2>Connect your notes</h2>
			<p class="muted">
				This app keeps everything in your private <code>sichos-notes</code> repo on GitHub. Connect it once on
				each device.
			</p>
			<a class="btn primary" href={resolve('/settings')}>Connect GitHub</a>
		</div>
	</div>
{:else if store.ready && !store.catalog.length && store.syncState === 'syncing'}
	<div class="page muted ui">Loading the catalog for the first time…</div>
{:else}
	{@render children()}
{/if}

<nav class="mobile ui">
	{#each nav as item (item.href)}
		<a href={item.href} class:active={item.match(path)}>{item.label}</a>
	{/each}
</nav>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 24px;
		padding: calc(10px + env(safe-area-inset-top)) var(--gutter) 10px;
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--line);
	}
	.brand {
		font-size: 20px;
		font-weight: 500;
		margin-inline-end: auto;
	}
	nav a {
		color: var(--muted);
		padding: 4px 2px;
	}
	nav a.active {
		color: var(--ink);
		box-shadow: inset 0 -2px var(--accent);
	}
	.desktop {
		display: flex;
		gap: 20px;
	}
	.mobile {
		display: none;
	}
	@media (max-width: 640px) {
		.desktop {
			display: none;
		}
		.mobile {
			position: fixed;
			inset: auto 0 0 0;
			z-index: 10;
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
			background: color-mix(in srgb, var(--surface) 92%, transparent);
			backdrop-filter: blur(10px);
			border-top: 1px solid var(--line);
		}
		.mobile a {
			text-align: center;
			padding: 10px 0;
			font-weight: 500;
		}
		.mobile a.active {
			box-shadow: none;
			color: var(--accent);
		}
	}
	.connect {
		padding: 28px;
		display: grid;
		gap: 12px;
		justify-items: start;
	}
	.connect p {
		margin: 0;
	}
</style>
