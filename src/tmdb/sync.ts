import { normalizePath, TFile, TFolder } from "obsidian";
import type LetterboxdPlugin from "../main";
import type { TMDBMovie } from "./types";
import { fetchTMDBMovie, templateNeedsCredits } from "./api";
import { renderTMDBTemplate, generateTMDBFilename } from "./template";
import { ensureFolderExists } from "../utils/vault";
import { createFrontmatterKeyRegex } from "../utils/frontmatter";
import { notify } from "../utils/notify";

// ============================================================================
// Types
// ============================================================================

export interface TMDBSyncResult {
	created: number;
	skipped: number;
	errors: number;
}

interface ExistingFilmNote {
	file: TFile;
	tmdbId: string | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all markdown files in the TMDB folder with their TMDB ID
 */
async function getExistingFilmNotes(plugin: LetterboxdPlugin): Promise<ExistingFilmNote[]> {
	const { vault } = plugin.app;
	const { tmdbFolderPath, tmdbIdFrontmatterKey } = plugin.settings;
	const notes: ExistingFilmNote[] = [];

	const folder = vault.getAbstractFileByPath(tmdbFolderPath);
	if (!(folder instanceof TFolder)) {
		return notes;
	}

	const tmdbIdRegex = createFrontmatterKeyRegex(tmdbIdFrontmatterKey);
	const files = folder.children.filter(
		(f): f is TFile => f instanceof TFile && f.extension === "md"
	);

	for (const file of files) {
		try {
			const content = await vault.cachedRead(file);
			const tmdbIdMatch = content.match(tmdbIdRegex);
			notes.push({
				file,
				tmdbId: tmdbIdMatch ? tmdbIdMatch[1].trim() : null,
			});
		} catch {
			// Skip unreadable files
		}
	}

	return notes;
}

/**
 * Gets a Set of all existing TMDB IDs from Film notes
 * Used to determine which films need to be fetched from TMDB
 */
export async function getExistingTmdbIds(plugin: LetterboxdPlugin): Promise<Set<string>> {
	const notes = await getExistingFilmNotes(plugin);
	return new Set(
		notes.map((n) => n.tmdbId).filter((id): id is string => id !== null && id !== "")
	);
}

/**
 * Creates a Film note for a TMDB movie
 */
async function createFilmNote(plugin: LetterboxdPlugin, movie: TMDBMovie): Promise<void> {
	const { vault } = plugin.app;
	const { tmdbFolderPath, tmdbFilenameTemplate, tmdbNoteTemplate } = plugin.settings;

	const filename = generateTMDBFilename(tmdbFilenameTemplate, movie);
	const content = renderTMDBTemplate(tmdbNoteTemplate, movie);
	const filePath = normalizePath(`${tmdbFolderPath}/${filename}.md`);

	const existingFile = vault.getAbstractFileByPath(filePath);
	if (existingFile) {
		// Add TMDB ID suffix to avoid collision (different movies with same title/year)
		await vault.create(
			normalizePath(`${tmdbFolderPath}/${filename} (${movie.tmdbId}).md`),
			content
		);
	} else {
		await vault.create(filePath, content);
	}
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Creates a Film note for a single TMDB ID if it doesn't already exist
 * @param plugin - Plugin instance
 * @param tmdbId - TMDB movie ID
 * @returns true if created, false if skipped (already exists or error)
 */
export async function syncSingleFilm(plugin: LetterboxdPlugin, tmdbId: string): Promise<boolean> {
	const { tmdbApiKey, tmdbFolderPath, tmdbLanguage } = plugin.settings;

	if (!tmdbApiKey) {
		return false;
	}

	if (!tmdbId) {
		return false;
	}

	try {
		await ensureFolderExists(plugin, tmdbFolderPath);

		// Check if note already exists
		const existingNotes = await getExistingFilmNotes(plugin);
		const existingIds = new Set(existingNotes.map((n) => n.tmdbId).filter(Boolean));

		if (existingIds.has(tmdbId)) {
			return false; // Already exists
		}

		// Check if template needs credits
		const { tmdbNoteTemplate } = plugin.settings;
		const includeCredits = templateNeedsCredits(tmdbNoteTemplate);

		// Fetch from TMDB and create note
		const movie = await fetchTMDBMovie(tmdbId, tmdbApiKey, tmdbLanguage, includeCredits);
		await createFilmNote(plugin, movie);
		return true;
	} catch (error) {
		console.error(`TMDB: Failed to sync film ${tmdbId}`, error);
		return false;
	}
}

/**
 * Syncs Film notes for multiple TMDB IDs
 * Used after Letterboxd sync to create Film notes for new diary entries
 * @param plugin - Plugin instance
 * @param tmdbIds - Array of TMDB movie IDs to sync
 * @returns Sync result with counts
 */
export async function syncFilmsFromTMDB(
	plugin: LetterboxdPlugin,
	tmdbIds: string[]
): Promise<TMDBSyncResult> {
	const result: TMDBSyncResult = { created: 0, skipped: 0, errors: 0 };
	const { tmdbApiKey, tmdbFolderPath, tmdbLanguage, tmdbNoteTemplate } = plugin.settings;

	if (!tmdbApiKey) {
		return result;
	}

	// Filter out empty IDs
	const validIds = tmdbIds.filter((id) => id && id.trim());
	if (validIds.length === 0) {
		return result;
	}

	// Check if template needs credits (only check once for all movies)
	const includeCredits = templateNeedsCredits(tmdbNoteTemplate);

	try {
		await ensureFolderExists(plugin, tmdbFolderPath);

		// Get existing notes to avoid duplicates
		const existingNotes = await getExistingFilmNotes(plugin);
		const existingIds = new Set(existingNotes.map((n) => n.tmdbId).filter(Boolean));

		// Process each ID
		for (const tmdbId of validIds) {
			if (existingIds.has(tmdbId)) {
				result.skipped++;
				continue;
			}

			try {
				const movie = await fetchTMDBMovie(
					tmdbId,
					tmdbApiKey,
					tmdbLanguage,
					includeCredits
				);
				await createFilmNote(plugin, movie);
				result.created++;
				// Add to set to handle duplicates within the batch
				existingIds.add(tmdbId);
			} catch (error) {
				console.error(`TMDB: Failed to fetch movie ${tmdbId}`, error);
				result.errors++;
			}
		}
	} catch (error) {
		console.error("TMDB: Sync failed", error);
	}

	return result;
}

/**
 * Syncs all Film notes from existing Letterboxd diary entries
 * Scans the Letterboxd folder for notes with tmdb_id and creates Film notes
 * @param plugin - Plugin instance
 * @returns Sync result with counts
 */
export async function syncAllFilmsFromDiary(plugin: LetterboxdPlugin): Promise<TMDBSyncResult> {
	const result: TMDBSyncResult = { created: 0, skipped: 0, errors: 0 };
	const { tmdbApiKey, folderPath, notificationLevel } = plugin.settings;

	if (!tmdbApiKey) {
		notify("TMDB: Please set your API key in settings", notificationLevel, "error");
		return result;
	}

	try {
		notify("TMDB: Scanning diary for films...", notificationLevel, "progress");

		const { vault } = plugin.app;
		const folder = vault.getAbstractFileByPath(folderPath);

		if (!(folder instanceof TFolder)) {
			notify("TMDB: Letterboxd folder not found", notificationLevel, "error");
			return result;
		}

		// Extract TMDB IDs from diary notes
		// Note: This uses the hardcoded key "tmdb_id" which matches the default diary note template
		const DIARY_TMDB_ID_KEY = "tmdb_id";
		const tmdbIdRegex = createFrontmatterKeyRegex(DIARY_TMDB_ID_KEY);
		const tmdbIds: string[] = [];

		const files = folder.children.filter(
			(f): f is TFile => f instanceof TFile && f.extension === "md"
		);

		for (const file of files) {
			try {
				const content = await vault.cachedRead(file);
				const match = content.match(tmdbIdRegex);
				if (match && match[1]) {
					tmdbIds.push(match[1]);
				}
			} catch {
				// Skip unreadable files
			}
		}

		if (tmdbIds.length === 0) {
			notify("TMDB: No diary entries with TMDB IDs found", notificationLevel, "progress");
			return result;
		}

		notify(`TMDB: Found ${tmdbIds.length} films, syncing...`, notificationLevel, "progress");

		const syncResult = await syncFilmsFromTMDB(plugin, tmdbIds);
		Object.assign(result, syncResult);

		notify(buildResultMessage(result), notificationLevel, "result", result.created > 0);
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		notify(`TMDB: Sync failed - ${msg}`, notificationLevel, "error");
		console.error("TMDB sync error:", error);
	}

	return result;
}

/**
 * Builds a user-friendly result message
 */
function buildResultMessage(result: TMDBSyncResult): string {
	const parts: string[] = [];
	if (result.created > 0) parts.push(`${result.created} created`);
	if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
	if (result.errors > 0) parts.push(`${result.errors} errors`);
	return parts.length ? `TMDB: ${parts.join(", ")}` : "TMDB: No changes";
}
