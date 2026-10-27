<script lang="ts">
	let { on, onclick, label, size = 20 }: { on: boolean; onclick: () => void; label: string; size?: number } = $props();
</script>

<button
	type="button"
	class="star"
	class:on
	style:--size="{size}px"
	aria-pressed={on}
	aria-label={label}
	title={on ? 'Remove from favorites' : 'Add to favorites'}
	onclick={(e) => {
		e.preventDefault();
		e.stopPropagation();
		onclick();
	}}
>
	<svg viewBox="0 0 24 24" aria-hidden="true">
		<path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
	</svg>
</button>

<style>
	.star {
		position: relative;
		flex: none;
		width: var(--size);
		height: var(--size);
		padding: 0;
		border: 0;
		background: none;
		color: var(--faint);
	}
	.star::after {
		content: '';
		position: absolute;
		inset: -10px;
	}
	svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
		stroke-linejoin: round;
	}
	.star:hover {
		color: var(--warn);
	}
	.on {
		color: var(--warn);
	}
	.on svg {
		fill: currentColor;
	}
</style>
