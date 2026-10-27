<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { hebrewNumeral } from '#lib/catalog/mafteiach.ts';
	import { store } from '#lib/store.svelte.ts';

	/** Go straight to a letter by its number — `543` or `תקמג`. */
	let q = $state('');
	let miss = $state(false);

	function go(e: SubmitEvent) {
		e.preventDefault();
		const t = q.trim();
		const num = /^\d+$/.test(t) ? Number(t) : hebrewNumeral(t);
		const letter = num ? store.igros.find((l) => l.num === num) : undefined;
		miss = !letter;
		if (letter) goto(resolve('/l/[id]', { id: letter.id }));
	}
</script>

<form class="jump ui" onsubmit={go}>
	<label for="jump">Letter</label>
	<input id="jump" bind:value={q} placeholder="543 or תקמג" dir="auto" inputmode="text" autocomplete="off" />
	<button class="btn">Go</button>
	{#if miss}<span class="miss">No letter {q} in these volumes.</span>{/if}
</form>

<style>
	.jump {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 10px;
	}
	label {
		color: var(--muted);
		font-style: italic;
	}
	input {
		width: 9em;
		font-size: 17px;
	}
	.miss {
		color: var(--red);
		font-style: italic;
	}
</style>
