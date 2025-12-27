import { normalizePath, TFile, TFolder } from "obsidian";
import type LetterboxdPlugin from "../main";
import type { LetterboxdEntry } from "../types";
import { fetchLetterboxdRSS } from "../letterboxd/parser";
import { parseLetterboxdExport } from "../letterboxd/csv-parser";
import { getExistingTmdbIds } from "../tmdb/sync";
import { renderTemplate, generateFilename } from "./template";
import { ensureFolderExists } from "../utils/vault";
import { createFrontmatterKeyRegex } from "../utils/frontmatter";
import { notify } from "../utils/notify";

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
	created: number;
	skipped: number;
	errors: number;
	/** TMDB IDs of newly created entries (for triggering TMDB sync) */
	createdTmdbIds: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all existing GUIDs from markdown files in the Letterboxd folder
 */
async function getExistingGuids(plugin: LetterboxdPlugin): Promise<Set<string>> {
	const { vault } = plugin.app;
	const { folderPath, guidFrontmatterKey } = plugin.settings;
	const guids = new Set<string>();

	const folder = vault.getAbstractFileByPath(folderPath);
	if (!(folder instanceof TFolder)) {
		return guids;
	}

	const guidRegex = createFrontmatterKeyRegex(guidFrontmatterKey);
	const files = folder.children.filter(
		(f): f is TFile => f instanceof TFile && f.extension === "md"
	);

	for (const file of files) {
		try {
			const content = await vault.cachedRead(file);
			const guidMatch = content.match(guidRegex);
			if (guidMatch) {
				guids.add(guidMatch[1].trim());
			}
		} catch {
			// Skip unreadable files
		}
	}

	return guids;
}

/**
 * Creates a note for a Letterboxd entry
 */
async function createNote(plugin: LetterboxdPlugin, entry: LetterboxdEntry): Promise<void> {
	const { vault } = plugin.app;
	const { folderPath, filenameTemplate, noteTemplate } = plugin.settings;

	const filename = generateFilename(filenameTemplate, entry);
	const content = renderTemplate(noteTemplate, entry);
	const filePath = normalizePath(`${folderPath}/${filename}.md`);

	const existingFile = vault.getAbstractFileByPath(filePath);
	if (existingFile) {
		// Add timestamp suffix to avoid collision
		const timestamp = Date.now();
		await vault.create(normalizePath(`${folderPath}/${filename} (${timestamp}).md`), content);
	} else {
		await vault.create(filePath, content);
	}
}

// ============================================================================
// RSS Sync
// ============================================================================

/**
 * Syncs Letterboxd diary entries via RSS
 */
export async function syncDiary(plugin: LetterboxdPlugin): Promise<SyncResult> {
	const { username, folderPath, syncReviewsOnly, notificationLevel } = plugin.settings;

	const result: SyncResult = { created: 0, skipped: 0, errors: 0, createdTmdbIds: [] };

	if (!username) {
		notify("Letterboxd: Please set your username in settings", notificationLevel, "error");
		return result;
	}

	try {
		notify("Letterboxd: Fetching diary...", notificationLevel, "progress");

		const allEntries = await fetchLetterboxdRSS(username, (current, total) => {
			// Update notice periodically to show progress
			if (current % 5 === 0 || current === total) {
				notify(
					`Letterboxd: Fetching entry ${current}/${total}...`,
					notificationLevel,
					"progress"
				);
			}
		});
		const entries = syncReviewsOnly
			? allEntries.filter((e) => e.review.length > 0)
			: allEntries;

		if (entries.length === 0) {
			notify("Letterboxd: No entries found", notificationLevel, "progress");
			return result;
		}

		await ensureFolderExists(plugin, folderPath);

		const existingGuids = await getExistingGuids(plugin);

		for (const entry of entries) {
			if (existingGuids.has(entry.guid)) {
				result.skipped++;
				continue;
			}

			try {
				await createNote(plugin, entry);
				result.created++;
				if (entry.tmdbId) {
					result.createdTmdbIds.push(entry.tmdbId);
				}
			} catch (error) {
				console.error(`Letterboxd: Failed to create "${entry.filmTitle}"`, error);
				result.errors++;
			}
		}

		notify(buildResultMessage("RSS", result), notificationLevel, "result", result.created > 0);
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		notify(`Letterboxd: Sync failed - ${msg}`, notificationLevel, "error");
		console.error("Letterboxd sync error:", error);
	}

	return result;
}

function buildResultMessage(source: string, result: SyncResult): string {
	const parts: string[] = [];
	if (result.created > 0) parts.push(`${result.created} created`);
	if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
	if (result.errors > 0) parts.push(`${result.errors} errors`);
	return parts.length
		? `Letterboxd ${source}: ${parts.join(", ")}`
		: `Letterboxd ${source}: No changes`;
}

// ============================================================================
// CSV Import
// ============================================================================

/**
 * Imports diary entries from Letterboxd CSV export
 * Creates new notes for entries not already in the vault (matched by GUID)
 */
export async function importFromCSV(
	plugin: LetterboxdPlugin,
	diaryCSV: string | null,
	reviewsCSV: string | null
): Promise<SyncResult> {
	const result: SyncResult = { created: 0, skipped: 0, errors: 0, createdTmdbIds: [] };

	const { folderPath, notificationLevel } = plugin.settings;

	try {
		notify(
			"Letterboxd: Processing CSV and fetching data from Letterboxd...",
			notificationLevel,
			"progress"
		);

		// Parse and enrich CSV files (fetches viewing ID and TMDB ID from Letterboxd)
		const entries = await parseLetterboxdExport(
			diaryCSV,
			reviewsCSV,
			(current, total) => {
				if (current % 10 === 0 || current === total) {
					notify(
						`Letterboxd: Fetching data... ${current}/${total}`,
						notificationLevel,
						"progress"
					);
				}
			}
		);

		if (entries.length === 0) {
			notify("Letterboxd: No entries found in CSV", notificationLevel, "progress");
			return result;
		}

		await ensureFolderExists(plugin, folderPath);

		const existingGuids = await getExistingGuids(plugin);
		const existingTmdbIds = await getExistingTmdbIds(plugin);

		for (const entry of entries) {
			if (existingGuids.has(entry.guid)) {
				result.skipped++;
				continue;
			}

			try {
				await createNote(plugin, entry);
				result.created++;

				// Track new TMDB IDs for Film note creation
				if (entry.tmdbId && !existingTmdbIds.has(entry.tmdbId)) {
					result.createdTmdbIds.push(entry.tmdbId);
					existingTmdbIds.add(entry.tmdbId);
				}
			} catch (error) {
				const msg = error instanceof Error ? error.message : "Unknown error";
				console.error(`Letterboxd: Failed to create "${entry.filmTitle}": ${msg}`);
				result.errors++;
			}
		}

		notify(buildResultMessage("CSV", result), notificationLevel, "result", result.created > 0);
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		notify(`Letterboxd CSV: Import failed - ${msg}`, notificationLevel, "error");
		console.error("Letterboxd CSV import error:", error);
	}

	return result;
}
