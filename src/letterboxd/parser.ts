import { requestUrl } from "obsidian";
import { TAGS_PENDING_FROM_RSS } from "../types";
import type { LetterboxdEntry } from "../types";

/** Base URL for Letterboxd RSS feeds */
const LETTERBOXD_RSS_BASE_URL = "https://letterboxd.com";

/** Namespace URIs used in Letterboxd RSS */
const NAMESPACES = {
	letterboxd: "https://letterboxd.com",
	tmdb: "https://themoviedb.org",
	dc: "http://purl.org/dc/elements/1.1/",
};

/**
 * Converts a numeric rating (0.5-5) to a star string representation
 * @param rating - Numeric rating from 0.5 to 5 in 0.5 increments
 * @returns Star string like "★★★½" or empty string if null
 */
export function ratingToStars(rating: number | null): string {
	if (rating === null || rating === undefined) {
		return "";
	}

	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 !== 0;

	return "★".repeat(fullStars) + (hasHalfStar ? "½" : "");
}

/**
 * Extracts the poster URL from the description HTML
 * @param descriptionHtml - HTML content from <description> CDATA
 * @returns Poster URL or empty string if not found
 */
function extractPosterUrl(descriptionHtml: string): string {
	const imgMatch = descriptionHtml.match(/<img\s+src="([^"]+)"/);
	return imgMatch ? imgMatch[1] : "";
}

/**
 * Extracts the review text from the description HTML
 * @param descriptionHtml - HTML content from <description> CDATA
 * @returns Plain text review or empty string if no review
 */
function extractReviewText(descriptionHtml: string): string {
	// Remove the img tag first
	let html = descriptionHtml.replace(/<p><img[^>]*\/><\/p>/g, "");

	// Remove spoiler warning paragraph
	html = html.replace(/<p><em>This review may contain spoilers\.<\/em><\/p>/g, "");

	// Remove "Watched on..." paragraph (for watch-only entries)
	html = html.replace(/<p>Watched on [^<]+<\/p>/g, "");

	// Convert paragraph tags to newlines and strip remaining HTML
	html = html.replace(/<\/p>\s*<p>/g, "\n\n");
	html = html.replace(/<\/?p>/g, "");
	html = html.replace(/<br\s*\/?>/g, "\n");

	// Convert common HTML entities
	html = html.replace(/&amp;/g, "&");
	html = html.replace(/&lt;/g, "<");
	html = html.replace(/&gt;/g, ">");
	html = html.replace(/&quot;/g, '"');
	html = html.replace(/&#039;/g, "'");
	html = html.replace(/&nbsp;/g, " ");

	// Strip any remaining HTML tags (like <em>, <strong>, <i>, <b>)
	html = html.replace(/<[^>]+>/g, "");

	return html.trim();
}

/**
 * Parses a date string to YYYY-MM-DD format
 * @param dateStr - Date string in various formats
 * @returns YYYY-MM-DD formatted date string
 */
function parseDate(dateStr: string): string {
	// letterboxd:watchedDate is already in YYYY-MM-DD format
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
		return dateStr;
	}

	// pubDate is in RFC 2822 format: "Fri, 5 Dec 2025 05:41:56 +1300"
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) {
		return "";
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

/**
 * Gets text content from an element with a specific namespace
 */
function getNamespacedText(item: Element, namespace: string, tagName: string): string {
	// Try with namespace prefix first
	const prefixedElements = item.getElementsByTagNameNS(namespace, tagName);
	if (prefixedElements.length > 0) {
		return prefixedElements[0].textContent || "";
	}

	// Fallback: try finding by local name with namespace prefix in tag
	const allElements = item.getElementsByTagName("*");
	for (let i = 0; i < allElements.length; i++) {
		const el = allElements[i];
		if (el.localName === tagName || el.tagName.endsWith(`:${tagName}`)) {
			return el.textContent || "";
		}
	}

	return "";
}

/**
 * Gets text content from a simple element
 */
function getElementText(item: Element, tagName: string): string {
	const elements = item.getElementsByTagName(tagName);
	return elements.length > 0 ? elements[0].textContent || "" : "";
}

/**
 * Parses a single RSS item into a LetterboxdEntry
 */
function parseItem(item: Element): LetterboxdEntry {
	const title = getElementText(item, "title");
	const link = getElementText(item, "link");
	const guid = getElementText(item, "guid");
	const pubDateRaw = getElementText(item, "pubDate");
	const description = getElementText(item, "description");

	// Letterboxd-specific fields
	const filmTitle = getNamespacedText(item, NAMESPACES.letterboxd, "filmTitle");
	const filmYearStr = getNamespacedText(item, NAMESPACES.letterboxd, "filmYear");
	const watchedDate = getNamespacedText(item, NAMESPACES.letterboxd, "watchedDate");
	const rewatchStr = getNamespacedText(item, NAMESPACES.letterboxd, "rewatch");
	const memberRatingStr = getNamespacedText(item, NAMESPACES.letterboxd, "memberRating");

	// TMDB ID
	const tmdbId = getNamespacedText(item, NAMESPACES.tmdb, "movieId");

	// Parse numeric values
	const filmYear = parseInt(filmYearStr, 10) || 0;
	const userRatingNo = memberRatingStr ? parseFloat(memberRatingStr) : null;

	// Check for spoilers in title
	const containsSpoilers = title.includes("(contains spoilers)");

	return {
		filmTitle,
		filmYear,
		userRatingNo,
		userRatingStars: ratingToStars(userRatingNo),
		watchedDate,
		rewatch: rewatchStr.toLowerCase() === "yes",
		link,
		tmdbId,
		posterUrl: extractPosterUrl(description),
		guid,
		review: extractReviewText(description),
		pubDate: parseDate(pubDateRaw),
		containsSpoilers,
		tags: [TAGS_PENDING_FROM_RSS],
	};
}

/**
 * Fetches and parses the RSS feed for a Letterboxd user
 * @param username - Letterboxd username
 * @returns Array of diary entries
 * @throws Error if fetch fails or XML is invalid
 */
export async function fetchLetterboxdRSS(username: string): Promise<LetterboxdEntry[]> {
	if (!username) {
		throw new Error("Letterboxd username is required");
	}

	const rssUrl = `${LETTERBOXD_RSS_BASE_URL}/${username}/rss/`;

	const response = await requestUrl({
		url: rssUrl,
		method: "GET",
	});

	if (response.status !== 200) {
		throw new Error(`Failed to fetch RSS feed: HTTP ${response.status}`);
	}

	const xmlText = response.text;
	const parser = new DOMParser();
	const doc = parser.parseFromString(xmlText, "application/xml");

	// Check for parse errors
	const parseError = doc.querySelector("parsererror");
	if (parseError) {
		throw new Error("Failed to parse RSS feed: Invalid XML");
	}

	const items = doc.querySelectorAll("item");
	const entries: LetterboxdEntry[] = [];

	items.forEach((item) => {
		entries.push(parseItem(item));
	});

	return entries;
}
