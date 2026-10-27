// App state: the catalog and every note, cached in IndexedDB so the app opens instantly and works offline.
// Saves go into a persisted queue and are written to the notes repo one at a time, in order.
import { get, set } from 'idb-keyval';
import { dev } from '$app/env';
import type { Sicha } from './catalog/types';
import { ConflictError, GitHubBackend, LocalBackend, type Backend, type GitHubConfig } from './notes/backend';
import { emptyNote, mergeNotes, parseNote, references, serializeNote, type Note } from './notes/note';

const CATALOG = 'catalog/ls.json';
const CONFIG_KEY = 'sichos.github';

interface Cached {
	sha: string;
	text: string;
}
interface Pending {
	path: string;
	text: string;
	message: string;
	/** The version this edit was made on top of; used to merge if the repo moved on. */
	base?: Cached;
}

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error' | 'unconfigured';

export const today = () => new Date().toLocaleDateString('sv');
export const notePath = (id: string) => `ls/${id}.md`;

const idb = {
	get: async <T>(k: string) => {
		try {
			return await get<T>(k);
		} catch {
			return undefined;
		}
	},
	set: async (k: string, v: unknown) => {
		try {
			await set(k, v);
		} catch {}
	}
};

function readConfig(): GitHubConfig | null {
	try {
		return JSON.parse(localStorage.getItem(CONFIG_KEY) ?? 'null');
	} catch {
		return null;
	}
}

class Store {
	catalog = $state.raw<Sicha[]>([]);
	notes = $state.raw<Record<string, Note>>({});
	syncState = $state<SyncState>('idle');
	syncMessage = $state('');
	pending = $state(0);
	lastSynced = $state<string>();
	ready = $state(false);

	byId = $derived(new Map(this.catalog.map((s) => [s.id, s])));
	volumes = $derived.by(() => {
		const vols = new Map<number, Sicha[]>();
		for (const s of this.catalog) {
			if (s.kind === 'meta') continue;
			if (!vols.has(s.vol)) vols.set(s.vol, []);
			vols.get(s.vol)!.push(s);
		}
		return vols;
	});
	/** Sicha id → paths of notes that link to it, the other direction of [[ls-…]] links. */
	backlinks = $derived.by(() => {
		const map = new Map<string, string[]>();
		for (const [path, note] of Object.entries(this.notes)) {
			for (const id of references(note.body)) {
				if (path === notePath(id)) continue;
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(path);
			}
		}
		return map;
	});

	private backend: Backend | null = null;
	private cache: Record<string, Cached> = {};
	private queue: Pending[] = [];
	private flushing: Pending | null = null;

	get config() {
		return readConfig();
	}

	async init() {
		this.cache = (await idb.get<Record<string, Cached>>('cache')) ?? {};
		this.queue = (await idb.get<Pending[]>('queue')) ?? [];
		this.rebuild();
		this.ready = true;
		this.connect();
		addEventListener('online', () => this.sync());
		document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && this.sync());
		setInterval(() => this.queue.length && this.flush(), 60_000);
	}

	connect(cfg = readConfig()) {
		this.backend = cfg ? new GitHubBackend(cfg) : dev ? new LocalBackend() : null;
		if (!this.backend) this.syncState = 'unconfigured';
		else this.sync();
	}

	async saveConfig(cfg: GitHubConfig | null) {
		if (cfg) await new GitHubBackend(cfg).verify();
		try {
			if (cfg) localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
			else localStorage.removeItem(CONFIG_KEY);
		} catch {}
		// A different repo means a different set of files.
		this.cache = {};
		await idb.set('cache', this.cache);
		this.rebuild();
		this.connect(cfg);
	}

	/** Re-derive catalog and notes from the cache, with unsent local edits on top. */
	private rebuild() {
		const catalog = this.cache[CATALOG];
		if (catalog) {
			try {
				this.catalog = JSON.parse(catalog.text);
			} catch {}
		}
		const notes: Record<string, Note> = {};
		for (const [path, { text }] of Object.entries(this.cache)) {
			if (path.endsWith('.md') && !path.startsWith('.')) notes[path] = parseNote(path, text);
		}
		for (const p of this.queue) notes[p.path] = parseNote(p.path, p.text);
		this.notes = notes;
		this.pending = this.queue.length;
	}

	async sync() {
		if (!this.backend || this.syncState === 'syncing') return;
		this.syncState = 'syncing';
		try {
			await this.flush();
			const tree = await this.backend.tree();
			const wanted = [...tree].filter(
				([p, sha]) => (p === CATALOG || p.endsWith('.md')) && this.cache[p]?.sha !== sha
			);
			for (let i = 0; i < wanted.length; i += 8) {
				await Promise.all(
					wanted.slice(i, i + 8).map(async ([p, sha]) => {
						this.cache[p] = { sha, text: await this.backend!.read(p, sha) };
					})
				);
			}
			for (const p of Object.keys(this.cache)) if (!tree.has(p)) delete this.cache[p];
			await idb.set('cache', $state.snapshot(this.cache));
			this.rebuild();
			this.lastSynced = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
			this.syncState = this.queue.length ? 'offline' : 'idle';
			this.syncMessage = '';
		} catch (e) {
			this.fail(e);
		}
	}

	private fail(e: unknown) {
		const network = e instanceof TypeError;
		this.syncState = network ? 'offline' : 'error';
		this.syncMessage = network ? 'Offline — changes are saved on this device' : String((e as Error).message ?? e);
	}

	save(note: Note, message: string) {
		const text = serializeNote(note);
		this.notes = { ...this.notes, [note.path]: note };
		// Fold into a queued edit of the same file, unless that one is already on its way.
		const queued = this.queue.findLast((p) => p.path === note.path);
		if (queued && queued !== this.flushing) {
			queued.text = text;
			queued.message = message;
		} else {
			this.queue.push({ path: note.path, text, message, base: queued ? undefined : this.cache[note.path] });
		}
		this.pending = this.queue.length;
		idb.set('queue', $state.snapshot(this.queue));
		this.flush();
	}

	private async flush() {
		if (this.flushing || !this.backend) return;
		try {
			while (this.queue.length) {
				const item = (this.flushing = this.queue[0]);
				try {
					const sha = await this.backend.write(item.path, item.text, item.base?.sha, item.message);
					this.cache[item.path] = { sha, text: item.text };
					this.queue.shift();
					// Later edits of the same file were made on top of this one.
					for (const p of this.queue) if (p.path === item.path) p.base = this.cache[item.path];
				} catch (e) {
					if (!(e instanceof ConflictError)) throw e;
					await this.resolveConflict(item);
				}
				this.pending = this.queue.length;
				await Promise.all([idb.set('queue', $state.snapshot(this.queue)), idb.set('cache', $state.snapshot(this.cache))]);
			}
		} catch (e) {
			this.fail(e);
		} finally {
			this.flushing = null;
		}
	}

	/** Someone (another device, the tagging Action) changed the file: merge and retry on top of theirs. */
	private async resolveConflict(item: Pending) {
		const sha = (await this.backend!.tree()).get(item.path);
		const theirs: Cached | undefined = sha ? { sha, text: await this.backend!.read(item.path, sha) } : undefined;
		const parse = (c?: Cached) => (c ? parseNote(item.path, c.text) : emptyNote(item.path));
		const merged = mergeNotes(item.base && parse(item.base), parseNote(item.path, item.text), parse(theirs));
		item.base = theirs;
		item.text = serializeNote(merged);
		if (theirs) this.cache[item.path] = theirs;
		this.notes = { ...this.notes, [item.path]: merged };
	}

	// Checklist helpers ------------------------------------------------------------

	note(id: string): Note {
		return this.notes[notePath(id)] ?? emptyNote(notePath(id));
	}

	isLearned(id: string) {
		return this.notes[notePath(id)]?.status === 'learned';
	}

	toggleLearned(id: string) {
		const n = this.note(id);
		if (n.status === 'learned') {
			// Unticking the same day is an undo; earlier dates are history and stay.
			this.save({ ...n, status: undefined, learned: n.learned.filter((d) => d !== today()) }, `unmark ${id}`);
		} else {
			const learned = n.learned.includes(today()) ? n.learned : [...n.learned, today()];
			this.save({ ...n, status: 'learned', learned }, `learned ${id}`);
		}
	}

	progress(sichos: Sicha[]) {
		const main = sichos.filter((s) => s.kind === 'sicha');
		return { done: main.filter((s) => this.isLearned(s.id)).length, total: main.length };
	}

	/** Most recently touched notes, newest first. */
	recent(limit = 8) {
		return Object.values(this.notes)
			.filter((n) => n.learned.length || n.body.trim())
			.sort((a, b) => (b.learned.at(-1) ?? '').localeCompare(a.learned.at(-1) ?? ''))
			.slice(0, limit);
	}
}

export const store = new Store();
