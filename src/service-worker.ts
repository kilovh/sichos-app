/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Makes the app open offline: the app shell is cached on install, fonts as they're used.
// Notes and the catalog never go through here — they live in IndexedDB and come from the GitHub API.
import { assets, immutable, prerendered } from '$app/manifest';
import { version } from '$app/env';

const sw = self as unknown as ServiceWorkerGlobalScope;
const APP = `app-${version}`;
const FONTS = 'fonts';
// Manifest paths are relative to where the app is served (e.g. /sichos-app/ on GitHub Pages).
const index = new URL(sw.registration.scope).pathname;
const shell = [...immutable, ...assets, ...prerendered].map((f) => new URL(f.path, sw.registration.scope).pathname);

sw.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(APP)
			.then((c) => c.addAll([...new Set([index, ...shell])]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== APP && k !== FONTS).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (e) => {
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);

	if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
		e.respondWith(
			caches.open(FONTS).then(async (c) => {
				const hit = await c.match(req);
				const fresh = fetch(req).then((res) => (res.ok && c.put(req, res.clone()), res));
				return hit ?? fresh;
			})
		);
		return;
	}
	if (url.origin !== location.origin) return;

	// Hash routing means every page is the same index.html: network first so updates land, cache when offline.
	if (req.mode === 'navigate') {
		e.respondWith(
			fetch(req)
				.then((res) => {
					const copy = res.clone();
					caches.open(APP).then((c) => c.put(index, copy));
					return res;
				})
				.catch(async () => (await caches.match(index)) ?? Response.error())
		);
		return;
	}
	e.respondWith(caches.match(req).then((hit) => hit ?? fetch(req)));
});
