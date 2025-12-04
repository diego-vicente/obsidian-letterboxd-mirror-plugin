import { Notice, TFile, TFolder } from "obsidian";
import type LetterboxdPlugin from "../main";
import type { LetterboxdEntry, LetterboxdSettings } from "../types";
import { TAGS_PENDING_FROM_RSS } from "../types";
import { fetchLetterboxdRSS } from "../letterboxd/parser";
import { parseLetterboxdExport } from "../letterboxd/csv-parser";
import { renderTemplate, generateFilename } from "./template";

// ============================================================================
// Types
// ============================================================================

export interface SyncResult {
	created: number;
	skipped: number;
	errors: number;
}

export interface CSVImportResult {
	created: number;
	updated: number;
	skipped: number;
	errors: string[];
}

interface ExistingNote {
	file: TFile;
	guid: string | null;
	content: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a regex to match GUID in frontmatter
 */
function createGuidRegex(guidKey: string): RegExp {
	const escapedKey = guidKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escapedKey}:\\s*(.+)$`, "m");
}

/**
 * Converts a filename template to a regex pattern for matching
 * e.g., "{{watchedDate}} - {{filmTitle}}" -> /^(.+) - (.+)$/
 */
function filenameTemplateToRegex(template: string): RegExp {
	// Escape regex special chars except our {{}} placeholders
	let pattern = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	
	// Replace {{variable}} with capture groups
	pattern = pattern.replace(/\\\{\\\{[^}]+\\\}\\\}/g, "(.+)");
	
	return new RegExp(`^${pattern}$`);
}

/**
 * Ensures the target folder exists
 */
async function ensureFolderExists(plugin: LetterboxdPlugin, folderPath: string): Promise<void> {
	const { vault } = plugin.app;
	const folder = vault.getAbstractFileByPath(folderPath);
	if (!(folder instanceof TFolder)) {
		await vault.createFolder(folderPath);
	}
}

/**
 * Gets all markdown files in the Letterboxd folder with their GUID
 */
async function getExistingNotes(plugin: LetterboxdPlugin): Promise<ExistingNote[]> {
	const { vault } = plugin.app;
	const { folderPath, guidFrontmatterKey } = plugin.settings;
	const notes: ExistingNote[] = [];

	const folder = vault.getAbstractFileByPath(folderPath);
	if (!(folder instanceof TFolder)) {
		return notes;
	}

	const guidRegex = createGuidRegex(guidFrontmatterKey);
	const files = folder.children.filter(
		(f): f is TFile => f instanceof TFile && f.extension === "md"
	);

	for (const file of files) {
		try {
			const content = await vault.cachedRead(file);
			const guidMatch = content.match(guidRegex);
			notes.push({
				file,
				guid: guidMatch ? guidMatch[1].trim() : null,
				content,
			});
		} catch {
			// Skip unreadable files
		}
	}

	return notes;
}

/**
 * Creates a note for a Letterboxd entry
 */
async function createNote(plugin: LetterboxdPlugin, entry: LetterboxdEntry): Promise<void> {
	const { vault } = plugin.app;
	const { folderPath, filenameTemplate, noteTemplate } = plugin.settings;

	const filename = generateFilename(filenameTemplate, entry);
	const content = renderTemplate(noteTemplate, entry);
	const filePath = `${folderPath}/${filename}.md`;

	const existingFile = vault.getAbstractFileByPath(filePath);
	if (existingFile) {
		// Add timestamp suffix to avoid collision
		const timestamp = Date.now();
		await vault.create(`${folderPath}/${filename} (${timestamp}).md`, content);
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
	const { username, folderPath, syncReviewsOnly } = plugin.settings;

	const result: SyncResult = { created: 0, skipped: 0, errors: 0 };

	if (!username) {
		new Notice("Letterboxd: Please set your username in settings");
		return result;
	}

	try {
		new Notice("Letterboxd: Fetching diary...");

		const allEntries = await fetchLetterboxdRSS(username);
		const entries = syncReviewsOnly
			? allEntries.filter((e) => e.review.length > 0)
			: allEntries;

		if (entries.length === 0) {
			new Notice("Letterboxd: No entries found");
			return result;
		}

		await ensureFolderExists(plugin, folderPath);

		const existingNotes = await getExistingNotes(plugin);
		const existingGuids = new Set(existingNotes.map((n) => n.guid).filter(Boolean));

		for (const entry of entries) {
			if (existingGuids.has(entry.guid)) {
				result.skipped++;
				continue;
			}

			try {
				await createNote(plugin, entry);
				result.created++;
			} catch (error) {
				console.error(`Letterboxd: Failed to create "${entry.filmTitle}"`, error);
				result.errors++;
			}
		}

		new Notice(buildResultMessage("RSS", result));
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		new Notice(`Letterboxd: Sync failed - ${msg}`);
		console.error("Letterboxd sync error:", error);
	}

	return result;
}

function buildResultMessage(source: string, result: SyncResult): string {
	const parts: string[] = [];
	if (result.created > 0) parts.push(`${result.created} created`);
	if (result.skipped > 0) parts.push(`${result.skipped} skipped`);
	if (result.errors > 0) parts.push(`${result.errors} errors`);
	return parts.length ? `Letterboxd ${source}: ${parts.join(", ")}` : `Letterboxd ${source}: No changes`;
}

// ============================================================================
// CSV Import
// ============================================================================

/**
 * Finds matching note for a CSV entry
 * Returns: { file, note } if exactly 1 match, null if 0 matches
 * Throws: Error if multiple matches (ambiguous)
 */
function findMatchingNote(
	entry: LetterboxdEntry,
	existingNotes: ExistingNote[],
	filenameRegex: RegExp,
	settings: LetterboxdSettings
): ExistingNote | null {
	const matches: ExistingNote[] = [];

	const expectedFilename = generateFilename(settings.filenameTemplate, entry);

	for (const note of existingNotes) {
		// Match by GUID
		if (note.guid && note.guid === entry.guid) {
			matches.push(note);
			continue;
		}

		// Match by filename pattern
		const basename = note.file.basename;
		if (basename === expectedFilename || filenameRegex.test(basename)) {
			// Additional check: verify it's the same film by checking frontmatter
			const filmMatch = note.content.match(/^film:\s*"?\[\[([^\]]+)\]\]"?/m);
			if (filmMatch) {
				const noteFilmTitle = filmMatch[1].toLowerCase().trim();
				const entryFilmTitle = entry.filmTitle.toLowerCase().trim();
				if (noteFilmTitle === entryFilmTitle) {
					matches.push(note);
				}
			}
		}
	}

	if (matches.length === 0) {
		return null;
	}

	if (matches.length > 1) {
		throw new Error(
			`Multiple matches for "${entry.filmTitle}" (${entry.watchedDate}): ` +
			matches.map((m) => m.file.basename).join(", ")
		);
	}

	return matches[0];
}

/**
 * Generates a regex to match a frontmatter line from the template
 * e.g., "letterboxd_tags: {{tags}}" -> /^letterboxd_tags:\s*(.*)$/m
 * Includes capture group for the existing value
 */
function createFrontmatterLineRegex(templateLine: string): RegExp {
	// Extract the key (before the colon)
	const colonIndex = templateLine.indexOf(":");
	if (colonIndex === -1) return new RegExp("$^"); // Never matches

	const key = templateLine.substring(0, colonIndex).trim();
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Match the key followed by any value until end of line (capture the value)
	return new RegExp(`^${escapedKey}:\\s*(.*)$`, "m");
}

/** Variables that represent dates - only compare date portion, ignore time */
const DATE_VARIABLES = new Set(["watchedDate", "watchedDatetime", "pubDate"]);

/** Variables that should never be overwritten by CSV import */
const IMMUTABLE_VARIABLES = new Set(["guid", "tmdbId", "posterUrl"]);

/**
 * Strips quotes and brackets to get the raw value for comparison
 */
function normalizeValue(value: string): string {
	return value
		.replace(/^["'\[\]]+|["'\[\]]+$/g, "") // Remove leading/trailing quotes and brackets
		.trim();
}

/**
 * Checks if a value is effectively empty
 */
function isEmptyValue(value: string): boolean {
	const normalized = normalizeValue(value);
	return !normalized || normalized === "" || normalized === "[]" || normalized === '""';
}

/**
 * Checks if the existing tags value contains the pending sentinel
 */
function hasPendingSentinel(existingValue: string): boolean {
	return existingValue.includes(TAGS_PENDING_FROM_RSS);
}

/**
 * Checks if a new value should replace the existing value
 * - Don't replace immutable fields (guid, tmdbId, posterUrl)
 * - Don't replace if new value is empty/null (EXCEPT tags with sentinel)
 * - Don't replace if values are equal (after normalization)
 * - For dates, don't replace if only time portion differs
 */
function shouldUpdateValue(
	varName: string,
	newValue: string,
	existingValue: string
): boolean {
	// Never overwrite certain fields from CSV
	if (IMMUTABLE_VARIABLES.has(varName)) {
		return false;
	}

	// Special case: tags with sentinel should always be replaced (even with empty)
	if (varName === "tags" && existingValue.includes(TAGS_PENDING_FROM_RSS)) {
		return true;
	}

	// Don't overwrite with empty values
	if (isEmptyValue(newValue)) {
		return false;
	}

	// Don't overwrite if existing value is not empty and values are equal
	const normalizedNew = normalizeValue(newValue);
	const normalizedExisting = normalizeValue(existingValue);

	if (normalizedNew === normalizedExisting) {
		return false;
	}

	// For date fields, compare only the date portion (YYYY-MM-DD)
	if (DATE_VARIABLES.has(varName)) {
		const newDate = normalizedNew.substring(0, 10); // "YYYY-MM-DD"
		const existingDate = normalizedExisting.substring(0, 10);
		if (newDate === existingDate) {
			return false;
		}
	}

	return true;
}

/**
 * Updates frontmatter in a note based on CSV entry
 * Only updates fields that exist in the template, doesn't touch the body
 * Preserves existing values when CSV has empty/null values
 */
function updateNoteFrontmatter(
	content: string,
	entry: LetterboxdEntry,
	settings: LetterboxdSettings
): string {
	// Extract frontmatter section
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) return content;

	let frontmatter = fmMatch[1];
	const body = content.substring(fmMatch[0].length);

	// Get template frontmatter lines
	const templateFmMatch = settings.noteTemplate.match(/^---\n([\s\S]*?)\n---/);
	if (!templateFmMatch) return content;

	const templateLines = templateFmMatch[1].split("\n");

	// For each template line, update the corresponding line in the note
	for (const templateLine of templateLines) {
		const trimmedLine = templateLine.trim();
		if (!trimmedLine || !trimmedLine.includes(":")) continue;

		// Check if this line has a variable we can update
		const varMatch = trimmedLine.match(/\{\{(\w+)\}\}/);
		if (!varMatch) continue;

		const varName = varMatch[1];

		// Find the existing line and get its value
		const lineRegex = createFrontmatterLineRegex(trimmedLine);
		const existingMatch = frontmatter.match(lineRegex);
		if (!existingMatch) continue;

		const existingValue = existingMatch[1] || "";

		// Generate the new line value
		const newLine = renderTemplate(trimmedLine, entry);
		
		// Extract just the value portion from the new line (after the colon)
		const colonIdx = newLine.indexOf(":");
		const newValue = colonIdx !== -1 ? newLine.substring(colonIdx + 1).trim() : "";

		// Check if we should update this field
		if (!shouldUpdateValue(varName, newValue, existingValue)) {
			continue;
		}

		// Replace the line
		frontmatter = frontmatter.replace(lineRegex, newLine);
	}

	return `---\n${frontmatter}\n---${body}`;
}

/**
 * Validates all entries before making any changes
 * Returns list of errors if any entry would cause problems
 */
async function validateCSVImport(
	entries: LetterboxdEntry[],
	existingNotes: ExistingNote[],
	filenameRegex: RegExp,
	settings: LetterboxdSettings
): Promise<string[]> {
	const errors: string[] = [];

	for (const entry of entries) {
		try {
			findMatchingNote(entry, existingNotes, filenameRegex, settings);
		} catch (error) {
			if (error instanceof Error) {
				errors.push(error.message);
			}
		}
	}

	return errors;
}

/**
 * Creates a key to identify unique films (for detecting rewatches)
 */
function createFilmKey(entry: LetterboxdEntry): string {
	return `${entry.filmTitle.toLowerCase()}|${entry.filmYear}`;
}

/**
 * Filters out rewatched films (same film watched multiple times)
 * Returns entries that are unique and a count of skipped rewatches
 */
function filterRewatches(entries: LetterboxdEntry[]): {
	unique: LetterboxdEntry[];
	rewatchCount: number;
	rewatchedFilms: string[];
} {
	const filmCounts = new Map<string, number>();
	
	// Count occurrences of each film
	for (const entry of entries) {
		const key = createFilmKey(entry);
		filmCounts.set(key, (filmCounts.get(key) || 0) + 1);
	}
	
	// Filter to only films watched once, track rewatched films
	const rewatchedFilms: string[] = [];
	const unique = entries.filter((entry) => {
		const key = createFilmKey(entry);
		const count = filmCounts.get(key) || 0;
		if (count > 1) {
			// Only add to rewatchedFilms list once per film
			const filmName = `${entry.filmTitle} (${entry.filmYear})`;
			if (!rewatchedFilms.includes(filmName)) {
				rewatchedFilms.push(filmName);
			}
			return false;
		}
		return true;
	});
	
	return {
		unique,
		rewatchCount: entries.length - unique.length,
		rewatchedFilms,
	};
}

/**
 * Imports diary entries from Letterboxd CSV export
 * - Creates new notes for entries not in vault
 * - Updates frontmatter for existing notes (matched by GUID or filename)
 * - Never touches the body of existing notes
 * - Skips rewatched films (unsupported for now)
 */
export async function importFromCSV(
	plugin: LetterboxdPlugin,
	diaryCSV: string | null,
	reviewsCSV: string | null
): Promise<CSVImportResult> {
	const result: CSVImportResult = {
		created: 0,
		updated: 0,
		skipped: 0,
		errors: [],
	};

	const { folderPath, filenameTemplate } = plugin.settings;

	try {
		new Notice("Letterboxd: Processing CSV...");

		// Parse CSV files
		const allEntries = parseLetterboxdExport(diaryCSV, reviewsCSV);

		if (allEntries.length === 0) {
			new Notice("Letterboxd: No entries found in CSV");
			return result;
		}

		// Filter out rewatches (unsupported for now)
		const { unique: entries, rewatchCount, rewatchedFilms } = filterRewatches(allEntries);
		
		if (rewatchCount > 0) {
			new Notice(
				`Letterboxd: Skipping ${rewatchCount} rewatch entries (${rewatchedFilms.length} films). Rewatches are not yet supported.`
			);
			console.log("Letterboxd: Skipped rewatched films:", rewatchedFilms);
		}

		if (entries.length === 0) {
			new Notice("Letterboxd: All entries are rewatches, nothing to import");
			return result;
		}

		await ensureFolderExists(plugin, folderPath);

		// Get existing notes
		const existingNotes = await getExistingNotes(plugin);
		const filenameRegex = filenameTemplateToRegex(filenameTemplate);

		// Validate first - check for ambiguous matches
		const validationErrors = await validateCSVImport(
			entries,
			existingNotes,
			filenameRegex,
			plugin.settings
		);

		if (validationErrors.length > 0) {
			result.errors = validationErrors;
			new Notice(
				`Letterboxd CSV: ${validationErrors.length} ambiguous matches found. Check console.`
			);
			console.error("Letterboxd CSV validation errors:", validationErrors);
			return result;
		}

		// Process entries
		for (const entry of entries) {
			try {
				const matchingNote = findMatchingNote(
					entry,
					existingNotes,
					filenameRegex,
					plugin.settings
				);

				if (matchingNote) {
					// Update existing note's frontmatter
					const newContent = updateNoteFrontmatter(
						matchingNote.content,
						entry,
						plugin.settings
					);

					if (newContent !== matchingNote.content) {
						await plugin.app.vault.modify(matchingNote.file, newContent);
						result.updated++;
					} else {
						result.skipped++;
					}
				} else {
					// Create new note
					await createNote(plugin, entry);
					result.created++;
				}
			} catch (error) {
				const msg = error instanceof Error ? error.message : "Unknown error";
				result.errors.push(`${entry.filmTitle}: ${msg}`);
			}
		}

		// Show result
		const parts: string[] = [];
		if (result.created > 0) parts.push(`${result.created} created`);
		if (result.updated > 0) parts.push(`${result.updated} updated`);
		if (result.skipped > 0) parts.push(`${result.skipped} unchanged`);
		if (result.errors.length > 0) parts.push(`${result.errors.length} errors`);

		new Notice(
			parts.length > 0
				? `Letterboxd CSV: ${parts.join(", ")}`
				: "Letterboxd CSV: No changes"
		);

		if (result.errors.length > 0) {
			console.error("Letterboxd CSV import errors:", result.errors);
		}

	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		new Notice(`Letterboxd CSV: Import failed - ${msg}`);
		console.error("Letterboxd CSV import error:", error);
		result.errors.push(msg);
	}

	return result;
}
