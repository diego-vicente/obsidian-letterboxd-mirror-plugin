/**
 * Letterboxd CSV Export Parser
 * 
 * Letterboxd exports contain multiple CSV files:
 * - diary.csv: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
 * - reviews.csv: Date, Name, Year, Letterboxd URI, Rating, Rewatch, Review, Tags, Watched Date
 * 
 * reviews.csv is a superset - contains entries that have reviews.
 * We merge both to get: all diary entries + reviews where available.
 */

import type { LetterboxdEntry } from "../types";
import { ratingToStars } from "./parser";

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
 * Generates a GUID for CSV entries
 * Format: letterboxd-csv-{uri-slug}
 * We extract the slug from the Letterboxd URI (e.g., https://boxd.it/abc123 -> abc123)
 */
function generateCSVGuid(uri: string): string {
	// Extract the ID from Letterboxd URI
	// Format: https://boxd.it/XXXXX or https://letterboxd.com/user/film/slug/
	const match = uri.match(/boxd\.it\/([a-zA-Z0-9]+)/) || 
	              uri.match(/letterboxd\.com\/[^/]+\/film\/[^/]+\/(\d+)/);
	
	if (match) {
		return `letterboxd-csv-${match[1]}`;
	}
	
	// Fallback: hash the URI
	const hash = uri.split("").reduce((acc, char) => {
		return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
	}, 0);
	return `letterboxd-csv-${Math.abs(hash).toString(36)}`;
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
 * Converts CSV entry data to LetterboxdEntry
 */
function toLetterboxdEntry(data: CSVEntryData): LetterboxdEntry {
	return {
		filmTitle: data.filmTitle,
		filmYear: data.filmYear,
		userRatingNo: data.rating,
		userRatingStars: ratingToStars(data.rating),
		watchedDate: data.watchedDate,
		rewatch: data.rewatch,
		link: data.uri,
		tmdbId: "", // Not available in CSV
		posterUrl: "", // Not available in CSV
		guid: generateCSVGuid(data.uri),
		review: data.review,
		pubDate: data.loggedDate,
		containsSpoilers: false, // Not available in CSV
		tags: data.tags,
	};
}

/**
 * Parses Letterboxd export and returns LetterboxdEntry array
 * Merges diary.csv and reviews.csv - reviews.csv takes precedence for review text
 */
export function parseLetterboxdExport(
	diaryCSV: string | null,
	reviewsCSV: string | null
): LetterboxdEntry[] {
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

	console.log(`Letterboxd: Total merged entries: ${mergedData.size}`);

	// Convert to LetterboxdEntry array
	return Array.from(mergedData.values()).map(toLetterboxdEntry);
}
