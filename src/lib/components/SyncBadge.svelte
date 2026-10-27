<script lang="ts">
	import { resolve } from '$app/paths';
	import { store } from '#lib/store.svelte.ts';

	const label = $derived(
		{
			idle: store.lastSynced ? `Synced ${store.lastSynced}` : 'Synced',
			syncing: 'Syncing…',
			offline: `${store.pending} unsent`,
			error: 'Sync problem',
			unconfigured: 'Not connected'
		}[store.syncState]
	);
</script>

<a class="badge {store.syncState}" href={resolve('/settings')} title={store.syncMessage || label}>
	<span class="dot"></span>
	<span class="text">{store.pending && store.syncState === 'idle' ? 'Saving…' : label}</span>
</a>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font-size: 12.5px;
		white-space: nowrap;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--done);
		opacity: 0.7;
	}
	.syncing .dot {
		animation: pulse 1s ease-in-out infinite alternate;
	}
	.offline .dot,
	.unconfigured .dot {
		background: var(--faint);
	}
	.error .dot {
		background: var(--warn);
	}
	.error {
		color: var(--warn);
	}
	@keyframes pulse {
		to {
			opacity: 0.2;
		}
	}
	@media (max-width: 640px) {
		.idle .text {
			display: none;
		}
	}
</style>
