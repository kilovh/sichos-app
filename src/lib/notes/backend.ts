// Where note files are read from and written to. Every file is addressed by path and identified
// by its git blob SHA, so a write can say which version it replaces and detect a conflicting edit.

export interface Backend {
	/** Every file in the repo, path → blob SHA. */
	tree(): Promise<Map<string, string>>;
	read(path: string, sha: string): Promise<string>;
	/** Returns the new blob SHA. Throws ConflictError if `sha` is no longer the current version. */
	write(path: string, text: string, sha: string | undefined, message: string): Promise<string>;
}

export class ConflictError extends Error {}

export interface GitHubConfig {
	owner: string;
	repo: string;
	branch: string;
	token: string;
}

const utf8ToBase64 = (s: string) => {
	const bytes = new TextEncoder().encode(s);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
};
const base64ToUtf8 = (b: string) =>
	new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

export class GitHubBackend implements Backend {
	constructor(private cfg: GitHubConfig) {}

	private async api(path: string, init: RequestInit = {}) {
		const res = await fetch(`https://api.github.com/repos/${this.cfg.owner}/${this.cfg.repo}${path}`, {
			...init,
			cache: 'no-store',
			headers: {
				Accept: 'application/vnd.github+json',
				Authorization: `Bearer ${this.cfg.token}`,
				'X-GitHub-Api-Version': '2022-11-28',
				...init.headers
			}
		});
		if (res.status === 409 || res.status === 422) throw new ConflictError(await res.text());
		if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
		return res.json();
	}

	async tree() {
		const { tree, truncated } = await this.api(`/git/trees/${encodeURIComponent(this.cfg.branch)}?recursive=1`);
		if (truncated) console.warn('Repo tree truncated; some notes may not load.');
		return new Map<string, string>(
			(tree as { path: string; type: string; sha: string }[])
				.filter((e) => e.type === 'blob')
				.map((e) => [e.path, e.sha])
		);
	}

	async read(_path: string, sha: string) {
		const { content } = await this.api(`/git/blobs/${sha}`);
		return base64ToUtf8(content);
	}

	async write(path: string, text: string, sha: string | undefined, message: string) {
		const res = await this.api(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
			method: 'PUT',
			body: JSON.stringify({ message, content: utf8ToBase64(text), sha, branch: this.cfg.branch })
		});
		return res.content.sha as string;
	}

	/** Cheap check used by the settings screen. */
	async verify() {
		const repo = await this.api('');
		return { private: repo.private as boolean, permissions: repo.permissions as { push: boolean } };
	}
}

/** Dev only: the ../notes folder on disk, served by the Vite plugin in vite.config.ts. */
export class LocalBackend implements Backend {
	async tree() {
		const res = await fetch('/__notes/tree');
		return new Map<string, string>(Object.entries(await res.json()));
	}

	async read(path: string) {
		return (await fetch(`/__notes/file?path=${encodeURIComponent(path)}`)).text();
	}

	async write(path: string, text: string, sha: string | undefined) {
		const res = await fetch(`/__notes/file?path=${encodeURIComponent(path)}`, {
			method: 'PUT',
			body: JSON.stringify({ text, sha })
		});
		if (res.status === 409) throw new ConflictError(path);
		if (!res.ok) throw new Error(await res.text());
		return (await res.json()).sha as string;
	}
}
