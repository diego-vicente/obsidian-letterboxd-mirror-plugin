/**
 * Letterboxd CSV Export Parser
 *
 * Letterboxd exports contain multiple CSV files:
 * - diary.csv: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
 * - reviews.csv: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Review, Tags, Watched Date
 *
 * reviews.csv is a superset - contains entries that have reviews.
 * We merge both to get: all diary entries + reviews where available.
 *
 * After parsing, entries are enriched by fetching Letterboxd pages to get:
 * - Viewing ID (for matching with RSS entries)
 * - TMDB ID (for creating Film notes)
 */

import type { LetterboxdEntry } from "../types";
import { ratingToStars } from "./parser";
import { fetchLetterboxdPageData } from "./fetcher";

/**
 * Parses a CSV line, handling quoted fields with commas and embedded quotes
 */
function parseCSVLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote ""
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			fields.push(current);
			current = "";
		} else {
			current += char;
		}
	}

	fields.push(current);
	return fields;
}

/**
 * Parses tags from CSV field (comma-separated within the field)
 */
function parseTags(tagsField: string): string[] {
	if (!tagsField || tagsField.trim() === "") {
		return [];
	}

	return tagsField
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0);
}

/**
 * Intermediate structure for merging diary + reviews
 */
interface CSVEntryData {
	filmTitle: string;
	filmYear: number;
	uri: string;
	rating: number | null;
	rewatch: boolean;
	tags: string[];
	review: string;
	watchedDate: string;
	loggedDate: string;
}

/**
 * Enriched entry data after fetching from Letterboxd pages
 */
interface EnrichedCSVEntryData extends CSVEntryData {
	/** Viewing ID from Letterboxd (e.g., "1093163294") */
	viewingId: string;
	/** TMDB movie ID (e.g., "281957") */
	tmdbId: string;
}

/**
 * Creates a unique key for merging entries
 */
function createMergeKey(filmTitle: string, filmYear: number, watchedDate: string): string {
	return `${filmTitle.toLowerCase()}|${filmYear}|${watchedDate}`;
}

/**
 * Parses diary.csv content
 * Columns: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
 */
function parseDiaryCSV(csvContent: string): Map<string, CSVEntryData> {
	const entries = new Map<string, CSVEntryData>();
	const lines = csvContent.split(/\r?\n/);

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const fields = parseCSVLine(line);
		if (fields.length < 8) continue;

		const filmTitle = fields[1];
		const filmYearStr = fields[2];
		const filmYear = parseInt(filmYearStr, 10) || 0;
		const watchedDate = fields[7];

		if (!filmTitle || !filmYear) continue;

		const key = createMergeKey(filmTitle, filmYear, watchedDate);

		entries.set(key, {
			filmTitle,
			filmYear,
			uri: fields[3],
			rating: fields[4] ? parseFloat(fields[4]) : null,
			rewatch: fields[5].toLowerCase() === "yes",
			tags: parseTags(fields[6]),
			review: "",
			watchedDate,
			loggedDate: fields[0],
		});
	}

	return entries;
}

/**
 * Parses reviews.csv content
 * Columns: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Review, Tags, Watched Date
 */
function parseReviewsCSV(csvContent: string): Map<string, CSVEntryData> {
	const entries = new Map<string, CSVEntryData>();
	const lines = csvContent.split(/\r?\n/);

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;

		const fields = parseCSVLine(line);
		if (fields.length < 9) continue;

		const filmTitle = fields[1];
		const filmYearStr = fields[2];
		const filmYear = parseInt(filmYearStr, 10) || 0;
		const watchedDate = fields[8];

		if (!filmTitle || !filmYear) continue;

		const key = createMergeKey(filmTitle, filmYear, watchedDate);

		entries.set(key, {
			filmTitle,
			filmYear,
			uri: fields[3],
			rating: fields[4] ? parseFloat(fields[4]) : null,
			rewatch: fields[5].toLowerCase() === "yes",
			tags: parseTags(fields[7]),
			review: fields[6] || "",
			watchedDate,
			loggedDate: fields[0],
		});
	}

	return entries;
}

/**
 * Converts enriched CSV entry data to LetterboxdEntry
 */
function toLetterboxdEntry(data: EnrichedCSVEntryData): LetterboxdEntry {
	return {
		filmTitle: data.filmTitle,
		filmYear: data.filmYear,
		userRatingNo: data.rating,
		userRatingStars: ratingToStars(data.rating),
		watchedDate: data.watchedDate,
		rewatch: data.rewatch,
		link: data.uri,
		tmdbId: data.tmdbId,
		posterUrl: "", // Will be fetched from TMDB if needed
		guid: data.viewingId,
		review: data.review,
		pubDate: data.loggedDate,
		containsSpoilers: false, // Not available in CSV
		tags: data.tags,
	};
}

/**
 * Callback for progress reporting during CSV enrichment
 */
export type EnrichmentProgressCallback = (
	current: number,
	total: number,
	filmTitle: string
) => void;

/**
 * Enriches a single CSV entry by fetching data from Letterboxd pages
 */
async function enrichEntry(data: CSVEntryData): Promise<EnrichedCSVEntryData | null> {
	const pageData = await fetchLetterboxdPageData(data.uri);

	if (!pageData) {
		console.warn(
			`Letterboxd: Failed to enrich "${data.filmTitle}" - could not fetch page data`
		);
		return null;
	}

	return {
		...data,
		viewingId: pageData.viewingId,
		tmdbId: pageData.tmdbId,
	};
}

/**
 * Parses Letterboxd export and returns LetterboxdEntry array
 * Merges diary.csv and reviews.csv - reviews.csv takes precedence for review text
 *
 * This is an async function that fetches additional data from Letterboxd pages
 * for each entry to get the viewing ID and TMDB ID.
 *
 * @param diaryCSV - Contents of diary.csv
 * @param reviewsCSV - Contents of reviews.csv
 * @param onProgress - Optional callback for progress reporting
 * @returns Array of enriched LetterboxdEntry objects
 */
export async function parseLetterboxdExport(
	diaryCSV: string | null,
	reviewsCSV: string | null,
	onProgress?: EnrichmentProgressCallback
): Promise<LetterboxdEntry[]> {
	const mergedData = new Map<string, CSVEntryData>();

	// Parse diary.csv first
	if (diaryCSV) {
		const diaryEntries = parseDiaryCSV(diaryCSV);
		console.log(`Letterboxd: Parsed ${diaryEntries.size} entries from diary.csv`);
		for (const [key, entry] of diaryEntries) {
			mergedData.set(key, entry);
		}
	}

	// Parse reviews.csv and merge
	if (reviewsCSV) {
		const reviewEntries = parseReviewsCSV(reviewsCSV);
		console.log(`Letterboxd: Parsed ${reviewEntries.size} entries from reviews.csv`);
		for (const [key, entry] of reviewEntries) {
			const existing = mergedData.get(key);
			if (existing) {
				// Merge: add review and update tags if present
				existing.review = entry.review;
				if (entry.tags.length > 0) {
					existing.tags = entry.tags;
				}
			} else {
				mergedData.set(key, entry);
			}
		}
	}

	const entries = Array.from(mergedData.values());
	const totalEntries = entries.length;
	console.log(`Letterboxd: Total merged entries: ${totalEntries}`);
	console.log(`Letterboxd: Enriching entries by fetching Letterboxd pages...`);

	// Enrich entries by fetching Letterboxd pages
	const enrichedEntries: LetterboxdEntry[] = [];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];

		if (onProgress) {
			onProgress(i + 1, totalEntries, entry.filmTitle);
		}

		const enrichedData = await enrichEntry(entry);

		if (enrichedData) {
			enrichedEntries.push(toLetterboxdEntry(enrichedData));
		}
	}

	console.log(
		`Letterboxd: Successfully enriched ${enrichedEntries.length}/${totalEntries} entries`
	);

	return enrichedEntries;
}
