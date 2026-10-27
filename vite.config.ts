import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * Dev-only stand-in for the GitHub API: serves ../notes so the app can be used without a token.
 * SHAs are computed the way git computes blob SHAs, so conflict handling behaves the same.
 */
function localNotes(dir = resolve('../notes')): Plugin {
	const sha = (buf: Buffer) => createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
	const walk = (d: string): string[] =>
		readdirSync(d).flatMap((f) => {
			if (f.startsWith('.')) return [];
			const p = join(d, f);
			return statSync(p).isDirectory() ? walk(p) : [p];
		});
	const safe = (p: string | null) => {
		const full = resolve(dir, p ?? '');
		if (!p || relative(dir, full).startsWith('..')) throw new Error('bad path');
		return full;
	};

	return {
		name: 'local-notes',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__notes', (req, res) => {
				const url = new URL(req.url!, 'http://x');
				try {
					if (url.pathname === '/tree') {
						const tree = Object.fromEntries(walk(dir).map((f) => [relative(dir, f), sha(readFileSync(f))]));
						res.setHeader('Content-Type', 'application/json');
						return res.end(JSON.stringify(tree));
					}
					const file = safe(url.searchParams.get('path'));
					if (req.method === 'GET') return res.end(readFileSync(file));
					let body = '';
					req.on('data', (c) => (body += c));
					req.on('end', () => {
						const { text, sha: expected } = JSON.parse(body);
						let current: string | undefined;
						try {
							current = sha(readFileSync(file));
						} catch {}
						if (current !== expected) {
							res.statusCode = 409;
							return res.end('conflict');
						}
						mkdirSync(dirname(file), { recursive: true });
						writeFileSync(file, text);
						res.end(JSON.stringify({ sha: sha(Buffer.from(text)) }));
					});
				} catch (e) {
					res.statusCode = 400;
					res.end(String(e));
				}
			});
		}
	};
}

export default defineConfig({
	plugins: [
		localNotes(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// GitHub Pages serves the app from /<repo>; hash routing means deep links never hit its 404.
			paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
			router: { type: 'hash' }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
