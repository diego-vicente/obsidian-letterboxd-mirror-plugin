/**
 * Letterboxd Page Fetcher
 * 
 * Fetches and extracts data from Letterboxd pages:
 * - User review page: viewing ID, film slug
 * - Main film page: TMDB ID
 */

import { requestUrl } from "obsidian";

/**
 * Data extracted from Letterboxd pages
 */
export interface LetterboxdPageData {
	/** Viewing/diary entry ID (e.g., "1093163294") */
	viewingId: string;
	/** Film slug for constructing URLs (e.g., "the-revenant-2015") */
	filmSlug: string;
	/** TMDB movie ID (e.g., "281957") */
	tmdbId: string;
}

/** Base URL for Letterboxd */
const LETTERBOXD_BASE_URL = "https://letterboxd.com";

/**
 * Extracts the viewing ID from a Letterboxd user review page HTML
 * Looks for: data-object-id="viewing:1093163294"
 */
function extractViewingIdFromHtml(html: string): string | null {
	const match = html.match(/data-object-id="viewing:(\d+)"/);
	return match ? match[1] : null;
}

/**
 * Extracts the film slug from a Letterboxd user review page HTML
 * Looks for: data-item-slug="the-revenant-2015"
 */
function extractFilmSlug(html: string): string | null {
	const match = html.match(/data-item-slug="([^"]+)"/);
	return match ? match[1] : null;
}

/**
 * Extracts the TMDB ID from a Letterboxd main film page HTML
 * Looks for: data-tmdb-id="281957" in the body tag
 */
function extractTmdbId(html: string): string | null {
	const match = html.match(/data-tmdb-id="(\d+)"/);
	return match ? match[1] : null;
}

/**
 * Fetches a URL and returns the response text
 * Uses Obsidian's requestUrl which handles redirects and CORS properly
 */
async function fetchPage(url: string): Promise<string> {
	const response = await requestUrl({
		url,
		method: "GET",
	});

	if (response.status !== 200) {
		throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
	}

	return response.text;
}

/**
 * Fetches data from a Letterboxd diary entry URL (boxd.it short URL)
 * 
 * Makes 2 requests:
 * 1. Fetch user review page (following boxd.it redirect) → viewing ID + film slug
 * 2. Fetch main film page → TMDB ID
 * 
 * @param letterboxdUri - The boxd.it URL from CSV (e.g., "https://boxd.it/bVO16l")
 * @returns Extracted page data or null if extraction fails
 */
export async function fetchLetterboxdPageData(letterboxdUri: string): Promise<LetterboxdPageData | null> {
	try {
		// Step 1: Fetch user review page (boxd.it redirects automatically)
		const reviewPageHtml = await fetchPage(letterboxdUri);

		const viewingId = extractViewingIdFromHtml(reviewPageHtml);
		const filmSlug = extractFilmSlug(reviewPageHtml);

		if (!viewingId || !filmSlug) {
			console.warn(`Letterboxd: Could not extract viewing ID or film slug from ${letterboxdUri}`);
			return null;
		}

		// Step 2: Fetch main film page to get TMDB ID
		const filmPageUrl = `${LETTERBOXD_BASE_URL}/film/${filmSlug}/`;
		const filmPageHtml = await fetchPage(filmPageUrl);

		const tmdbId = extractTmdbId(filmPageHtml);

		if (!tmdbId) {
			console.warn(`Letterboxd: Could not extract TMDB ID from ${filmPageUrl}`);
			// Still return partial data - TMDB ID might not be available for all films
			return {
				viewingId,
				filmSlug,
				tmdbId: "",
			};
		}

		return {
			viewingId,
			filmSlug,
			tmdbId,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`Letterboxd: Failed to fetch page data from ${letterboxdUri}: ${message}`);
		return null;
	}
}

/**
 * Extracts the viewing ID from RSS GUID format
 * 
 * RSS format: letterboxd-review-{id} or letterboxd-watch-{id}
 * 
 * @returns The viewing ID or null if not a valid RSS GUID
 */
export function extractViewingIdFromRssGuid(guid: string): string | null {
	const match = guid.match(/^letterboxd-(?:review|watch)-(\d+)$/);
	return match ? match[1] : null;
}
