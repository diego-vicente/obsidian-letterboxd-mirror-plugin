import { Plugin, Notice } from "obsidian";
import type { LetterboxdSettings } from "./types";
import { DEFAULT_SETTINGS, LetterboxdSettingTab } from "./settings";
import { syncDiary, importFromCSV } from "./notes/sync";
import { syncFilmsFromTMDB, syncAllFilmsFromDiary } from "./tmdb/sync";

/** Delay before auto-sync on startup (ms) - allows vault to fully load */
const STARTUP_SYNC_DELAY_MS = 3000;

/** Expected CSV filenames in Letterboxd export */
const DIARY_CSV_FILENAME = "diary.csv";
const REVIEWS_CSV_FILENAME = "reviews.csv";

export default class LetterboxdPlugin extends Plugin {
	settings: LetterboxdSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new LetterboxdSettingTab(this.app, this));

		// Register sync command
		this.addCommand({
			id: "sync-diary",
			name: "Sync Letterboxd diary",
			callback: () => this.syncDiary(),
		});

		// Register CSV import command
		this.addCommand({
			id: "import-csv",
			name: "Import from Letterboxd CSV export",
			callback: () => this.importCSVFolder(),
		});

		// Register TMDB sync command
		this.addCommand({
			id: "sync-films",
			name: "Sync TMDB film data",
			callback: () => this.syncTMDBFilms(),
		});

		// Add ribbon icon
		this.addRibbonIcon("clapperboard", "Sync Letterboxd diary", () => {
			this.syncDiary();
		});

		// Auto-sync on startup if enabled
		if (this.settings.syncOnStartup && this.settings.username) {
			this.registerInterval(
				window.setTimeout(() => {
					this.syncDiary();
				}, STARTUP_SYNC_DELAY_MS)
			);
		}
	}

	onunload(): void {
		// Cleanup is handled automatically by register* methods
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Triggers a diary sync via RSS
	 * If TMDB API key is configured, also syncs Film notes for new entries
	 */
	async syncDiary(): Promise<void> {
		const result = await syncDiary(this);

		// If TMDB is enabled and we created new diary entries, sync Film notes
		if (this.settings.tmdbApiKey && result.createdTmdbIds.length > 0) {
			const tmdbResult = await syncFilmsFromTMDB(this, result.createdTmdbIds);
			if (tmdbResult.created > 0 || tmdbResult.errors > 0) {
				const parts: string[] = [];
				if (tmdbResult.created > 0) parts.push(`${tmdbResult.created} films created`);
				if (tmdbResult.skipped > 0) parts.push(`${tmdbResult.skipped} skipped`);
				if (tmdbResult.errors > 0) parts.push(`${tmdbResult.errors} errors`);
				new Notice(`TMDB: ${parts.join(", ")}`);
			}
		}
	}

	/**
	 * Syncs all TMDB Film notes from existing diary entries
	 */
	async syncTMDBFilms(): Promise<void> {
		if (!this.settings.tmdbApiKey) {
			new Notice("TMDB: Please set your API key in settings");
			return;
		}
		await syncAllFilmsFromDiary(this);
	}

	/**
	 * Opens folder picker to import Letterboxd CSV export
	 * Expects a folder containing diary.csv and optionally reviews.csv
	 */
	async importCSVFolder(): Promise<void> {
		// Create a file input that accepts directories
		// Note: webkitdirectory is not standard but works in Electron/Obsidian
		const input = document.createElement("input");
		input.type = "file";
		input.setAttribute("webkitdirectory", "");
		input.setAttribute("directory", "");

		input.onchange = async () => {
			const files = input.files;
			if (!files || files.length === 0) {
				return;
			}

			try {
				let diaryCSV: string | null = null;
				let reviewsCSV: string | null = null;

				// Find diary.csv and reviews.csv at the ROOT of the selected folder
				// webkitRelativePath format: "folderName/file.csv" for root files
				// vs "folderName/subfolder/file.csv" for nested files
				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					const relativePath =
						(file as File & { webkitRelativePath?: string }).webkitRelativePath || "";
					const pathParts = relativePath.split("/");

					// Only process files at root level (exactly 2 parts: folder/file.csv)
					if (pathParts.length !== 2) continue;

					const filename = file.name.toLowerCase();

					if (filename === DIARY_CSV_FILENAME) {
						diaryCSV = await file.text();
						console.log(
							`Letterboxd: Found diary.csv at root (${diaryCSV.length} chars)`
						);
					} else if (filename === REVIEWS_CSV_FILENAME) {
						reviewsCSV = await file.text();
						console.log(
							`Letterboxd: Found reviews.csv at root (${reviewsCSV.length} chars)`
						);
					}
				}

				if (!diaryCSV && !reviewsCSV) {
					new Notice("Letterboxd: No diary.csv or reviews.csv found in folder");
					return;
				}

				const csvResult = await importFromCSV(this, diaryCSV, reviewsCSV);

				// If TMDB is enabled and we have new films, sync Film notes
				if (this.settings.tmdbApiKey && csvResult.newTmdbIds.length > 0) {
					new Notice(`TMDB: Creating ${csvResult.newTmdbIds.length} Film notes...`);
					const tmdbResult = await syncFilmsFromTMDB(this, csvResult.newTmdbIds);
					if (tmdbResult.created > 0 || tmdbResult.errors > 0) {
						const parts: string[] = [];
						if (tmdbResult.created > 0)
							parts.push(`${tmdbResult.created} films created`);
						if (tmdbResult.skipped > 0) parts.push(`${tmdbResult.skipped} skipped`);
						if (tmdbResult.errors > 0) parts.push(`${tmdbResult.errors} errors`);
						new Notice(`TMDB: ${parts.join(", ")}`);
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error";
				new Notice(`Letterboxd: Failed to read CSV files - ${message}`);
				console.error("Letterboxd CSV read error:", error);
			}
		};

		input.click();
	}
}
