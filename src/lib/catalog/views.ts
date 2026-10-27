import { parshiyosOf } from './parshiyos';
import type { Sicha } from './types';

/** Parsha → its sichos across all volumes (a combined heading like ויקהל-פקודי counts for both). */
export function byParsha(catalog: Sicha[]) {
	const map = new Map<string, Sicha[]>();
	for (const s of catalog) {
		if (s.kind !== 'sicha') continue;
		for (const p of new Set(s.groups.flatMap(parshiyosOf))) {
			if (!map.has(p)) map.set(p, []);
			map.get(p)!.push(s);
		}
	}
	return map;
}

/** Headings that aren't parshiyos — moadim, months, Tanya notes — with their sichos, biggest first. */
export function byOtherHeading(catalog: Sicha[]) {
	const map = new Map<string, Sicha[]>();
	for (const s of catalog) {
		if (s.kind !== 'sicha') continue;
		for (const g of s.groups) {
			if (parshiyosOf(g).length) continue;
			if (!map.has(g)) map.set(g, []);
			map.get(g)!.push(s);
		}
	}
	return [...map].sort((a, b) => b[1].length - a[1].length);
}

/** Consecutive runs of sichos under the same heading, in volume order. */
export function runs(sichos: Sicha[]) {
	const out: { heading: string; sichos: Sicha[] }[] = [];
	for (const s of sichos) {
		const heading = s.groups[0];
		if (out.at(-1)?.heading === heading) out.at(-1)!.sichos.push(s);
		else out.push({ heading, sichos: [s] });
	}
	return out;
}
