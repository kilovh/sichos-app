<script lang="ts">
	let { checked, onclick, label, size = 17 }: { checked: boolean; onclick: () => void; label: string; size?: number } =
		$props();
</script>

<button
	type="button"
	class="check"
	class:checked
	style:--size="{size}px"
	role="checkbox"
	aria-checked={checked}
	aria-label={label}
	onclick={(e) => {
		e.preventDefault();
		e.stopPropagation();
		onclick();
	}}
>
	<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>
</button>

<style>
	/* A square: hairline when open, solid ink when done. */
	.check {
		position: relative;
		flex: none;
		width: var(--size);
		height: var(--size);
		padding: 0;
		display: grid;
		place-items: center;
		border: 1px solid var(--muted);
		background: transparent;
		transition:
			background 0.12s,
			border-color 0.12s;
	}
	.check:hover {
		border-color: var(--ink);
	}
	svg {
		width: 70%;
		fill: none;
		stroke: var(--bg);
		stroke-width: 2.2;
		stroke-linecap: square;
		stroke-linejoin: miter;
		opacity: 0;
	}
	.checked {
		background: var(--ink);
		border-color: var(--ink);
	}
	.checked svg {
		opacity: 1;
	}
	/* Bigger hit area than the visible square, for thumbs. */
	.check::after {
		content: '';
		position: absolute;
		inset: -10px;
	}
</style>
