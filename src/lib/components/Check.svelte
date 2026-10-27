<script lang="ts">
	let { checked, onclick, label, size = 22 }: { checked: boolean; onclick: () => void; label: string; size?: number } =
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
	.check {
		flex: none;
		width: var(--size);
		height: var(--size);
		padding: 0;
		display: grid;
		place-items: center;
		border-radius: 50%;
		border: 1.5px solid var(--faint);
		background: transparent;
		transition:
			background 0.15s,
			border-color 0.15s;
	}
	.check:hover {
		border-color: var(--done);
	}
	svg {
		width: 62%;
		fill: none;
		stroke: var(--bg);
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0;
	}
	.checked {
		background: var(--done);
		border-color: var(--done);
	}
	.checked svg {
		opacity: 1;
	}
	/* Bigger hit area than the visible circle, for thumbs. */
	.check {
		position: relative;
	}
	.check::after {
		content: '';
		position: absolute;
		inset: -10px;
	}
</style>
