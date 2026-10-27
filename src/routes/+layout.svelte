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

	// Light / dark follows the system unless chosen here; the choice is remembered on this device.
	type Theme = 'auto' | 'light' | 'dark';
	let theme = $state<Theme>('auto');
	onMount(() => {
		try {
			theme = (localStorage.getItem('sichos.theme') as Theme) ?? 'auto';
		} catch {}
	});
	$effect(() => {
		if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
		else document.documentElement.dataset.theme = theme;
		try {
			localStorage.setItem('sichos.theme', theme);
		} catch {}
	});
	const nextTheme: Record<Theme, Theme> = { auto: 'dark', dark: 'light', light: 'auto' };

	const nav = [
		{ href: resolve('/'), label: 'Home', match: (p: string) => p === '/' },
		{ href: resolve('/browse'), label: 'Browse', match: (p: string) => /^\/(browse|vol|parsha|group|tm|t\/|igros|l\/)/.test(p) },
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
	<div class="tools">
		<SyncBadge />
		<button
			class="theme"
			onclick={() => (theme = nextTheme[theme])}
			title="Theme: {theme}"
			aria-label="Switch theme (now {theme})"
		>
			{theme === 'auto' ? '◐' : theme === 'dark' ? '●' : '○'}
		</button>
	</div>
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
		align-items: baseline;
		gap: 28px;
		padding: calc(12px + env(safe-area-inset-top)) var(--gutter) 11px;
		background: var(--bg);
		border-bottom: 1px solid var(--ink);
	}
	.brand {
		font-size: 23px;
		font-weight: 500;
		line-height: 1;
		margin-inline-end: auto;
	}
	nav a {
		color: var(--muted);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	nav a:hover {
		color: var(--ink);
	}
	nav a.active {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--red);
		text-decoration-thickness: 2px;
		text-underline-offset: 7px;
	}
	.desktop {
		display: flex;
		gap: 22px;
	}
	.tools {
		display: flex;
		align-items: baseline;
		gap: 14px;
	}
	.theme {
		border: 0;
		background: none;
		padding: 0 2px;
		color: var(--muted);
		font-size: 14px;
		line-height: 1;
	}
	.theme:hover {
		color: var(--ink);
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
			padding: 2px 0 env(safe-area-inset-bottom);
			background: var(--bg);
			border-top: 1px solid var(--ink);
		}
		.mobile a {
			text-align: center;
			padding: 14px 0;
		}
		.mobile a.active {
			text-underline-offset: 6px;
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
