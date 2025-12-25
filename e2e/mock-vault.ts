/**
 * Mock Vault for E2E Tests
 *
 * Provides a filesystem-backed mock of Obsidian's Vault API.
 * Uses a temp directory to simulate vault operations.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { TFile, TFolder } from "./obsidian-mock";
import type { LetterboxdSettings } from "../src/types";

// ============================================================================
// Mock Vault Implementation
// ============================================================================

/**
 * A TFile backed by the real filesystem
 */
class MockTFile extends TFile {
	constructor(
		public path: string,
		public basename: string,
		public extension: string
	) {
		super(path);
		this.basename = basename;
		this.extension = extension;
	}
}

/**
 * A TFolder backed by the real filesystem
 */
class MockTFolder extends TFolder {
	children: (MockTFile | MockTFolder)[] = [];

	constructor(public path: string) {
		super(path);
	}
}

/**
 * Mock Vault that uses the filesystem
 */
export class MockVault {
	private basePath: string;

	constructor(basePath: string) {
		this.basePath = basePath;
	}

	/**
	 * Gets the full filesystem path for a vault path
	 */
	private getFullPath(vaultPath: string): string {
		return path.join(this.basePath, vaultPath);
	}

	/**
	 * Gets an abstract file by path (file or folder)
	 */
	getAbstractFileByPath(vaultPath: string): MockTFile | MockTFolder | null {
		const fullPath = this.getFullPath(vaultPath);

		if (!fs.existsSync(fullPath)) {
			return null;
		}

		const stats = fs.statSync(fullPath);

		if (stats.isDirectory()) {
			const folder = new MockTFolder(vaultPath);
			// Populate children
			const entries = fs.readdirSync(fullPath);
			for (const entry of entries) {
				const entryPath = path.join(vaultPath, entry);
				const entryFullPath = path.join(fullPath, entry);
				const entryStats = fs.statSync(entryFullPath);

				if (entryStats.isDirectory()) {
					folder.children.push(new MockTFolder(entryPath));
				} else {
					const ext = path.extname(entry).slice(1);
					const basename = path.basename(entry, `.${ext}`);
					folder.children.push(new MockTFile(entryPath, basename, ext));
				}
			}
			return folder;
		} else {
			const ext = path.extname(vaultPath).slice(1);
			const basename = path.basename(vaultPath, `.${ext}`);
			return new MockTFile(vaultPath, basename, ext);
		}
	}

	/**
	 * Creates a folder
	 */
	async createFolder(vaultPath: string): Promise<void> {
		const fullPath = this.getFullPath(vaultPath);
		fs.mkdirSync(fullPath, { recursive: true });
	}

	/**
	 * Creates a file with content
	 */
	async create(vaultPath: string, content: string): Promise<MockTFile> {
		const fullPath = this.getFullPath(vaultPath);
		const dir = path.dirname(fullPath);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(fullPath, content, "utf-8");

		const ext = path.extname(vaultPath).slice(1);
		const basename = path.basename(vaultPath, `.${ext}`);
		return new MockTFile(vaultPath, basename, ext);
	}

	/**
	 * Reads a file (cached read in real Obsidian, just read here)
	 */
	async cachedRead(file: MockTFile): Promise<string> {
		const fullPath = this.getFullPath(file.path);
		return fs.readFileSync(fullPath, "utf-8");
	}

	/**
	 * Reads a file
	 */
	async read(file: MockTFile): Promise<string> {
		return this.cachedRead(file);
	}

	/**
	 * Modifies a file's content
	 */
	async modify(file: MockTFile, content: string): Promise<void> {
		const fullPath = this.getFullPath(file.path);
		fs.writeFileSync(fullPath, content, "utf-8");
	}

	/**
	 * Deletes a file
	 */
	async delete(file: MockTFile): Promise<void> {
		const fullPath = this.getFullPath(file.path);
		fs.unlinkSync(fullPath);
	}

	/**
	 * Lists all markdown files in a folder
	 */
	getMarkdownFiles(): MockTFile[] {
		const files: MockTFile[] = [];
		this.walkDir(this.basePath, "", files);
		return files;
	}

	private walkDir(fullPath: string, vaultPath: string, files: MockTFile[]): void {
		const entries = fs.readdirSync(fullPath);
		for (const entry of entries) {
			const entryFullPath = path.join(fullPath, entry);
			const entryVaultPath = vaultPath ? path.join(vaultPath, entry) : entry;
			const stats = fs.statSync(entryFullPath);

			if (stats.isDirectory()) {
				this.walkDir(entryFullPath, entryVaultPath, files);
			} else if (entry.endsWith(".md")) {
				const ext = "md";
				const basename = path.basename(entry, ".md");
				files.push(new MockTFile(entryVaultPath, basename, ext));
			}
		}
	}
}

// ============================================================================
// Mock Plugin
// ============================================================================

/**
 * Mock App with vault
 */
export class MockApp {
	vault: MockVault;

	constructor(vaultPath: string) {
		this.vault = new MockVault(vaultPath);
	}
}

/** Default settings for E2E tests */
const E2E_DEFAULT_SETTINGS: LetterboxdSettings = {
	username: "",
	folderPath: "Letterboxd",
	filenameTemplate: "{{watchedDate}} - {{filmTitle}}",
	noteTemplate: `---
film: "[[{{filmTitle}} ({{filmYear}})]]"
rating: {{userRatingNoOver10}}
watched_date: {{watchedDate}}
letterboxd_url: {{link yaml=true}}
tmdb_id: {{tmdbId}}
poster: {{posterUrl yaml=true}}
letterboxd_guid: {{guid}}
letterboxd_tags: {{tags yaml=true}}
---

# [[{{filmTitle}} ({{filmYear}})]]

{{posterUrl skipEmpty=true prefix="![Poster](" suffix=")"}}

**Rating**: {{userRatingStars}}
**Watched**: {{watchedDate}}{{#if rewatch}} (rewatch){{/if}}

{{review skipEmpty=true quote=true}}

---
[View on Letterboxd]({{link}})
`,
	syncOnStartup: false,
	syncReviewsOnly: false,
	guidFrontmatterKey: "letterboxd_guid",
	tmdbApiKey: "",
	tmdbFolderPath: "Films",
	tmdbFilenameTemplate: "{{title}} ({{year}})",
	tmdbNoteTemplate: `---
title: "{{title}}"
year: {{year}}
tmdb_id: {{tmdbId}}
---

# {{title}} ({{year}})
`,
	tmdbLanguage: "en-US",
	tmdbIdFrontmatterKey: "tmdb_id",
};

/**
 * Mock Plugin instance for testing
 */
export class MockPlugin {
	app: MockApp;
	settings: LetterboxdSettings;

	constructor(vaultPath: string, settings?: Partial<LetterboxdSettings>) {
		this.app = new MockApp(vaultPath);
		this.settings = { ...E2E_DEFAULT_SETTINGS, ...settings };
	}
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a temporary vault directory for testing
 */
export function createTempVault(): string {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "letterboxd-e2e-"));
	return tempDir;
}

/**
 * Cleans up a temporary vault directory
 */
export function cleanupTempVault(vaultPath: string): void {
	if (vaultPath.includes("letterboxd-e2e-")) {
		fs.rmSync(vaultPath, { recursive: true, force: true });
	}
}

/**
 * Creates a note in the mock vault
 */
export function createNoteInVault(vaultPath: string, notePath: string, content: string): void {
	const fullPath = path.join(vaultPath, notePath);
	const dir = path.dirname(fullPath);

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	fs.writeFileSync(fullPath, content, "utf-8");
}

/**
 * Reads a note from the mock vault
 */
export function readNoteFromVault(vaultPath: string, notePath: string): string {
	const fullPath = path.join(vaultPath, notePath);
	return fs.readFileSync(fullPath, "utf-8");
}

/**
 * Lists all notes in a folder
 */
export function listNotesInVault(vaultPath: string, folderPath: string): string[] {
	const fullPath = path.join(vaultPath, folderPath);

	if (!fs.existsSync(fullPath)) {
		return [];
	}

	return fs
		.readdirSync(fullPath)
		.filter((f) => f.endsWith(".md"))
		.map((f) => f.replace(".md", ""));
}
