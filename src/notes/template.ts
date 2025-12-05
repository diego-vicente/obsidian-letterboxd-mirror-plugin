import type { LetterboxdEntry } from "../types";
import { createTemplateEngine } from "../template-engine";
import type { RawValue } from "../template-engine";

/**
 * Map of template variable names to their accessor functions
 */
const LETTERBOXD_ACCESSORS: Record<string, (entry: LetterboxdEntry) => RawValue> = {
	filmTitle: (e) => e.filmTitle,
	filmYear: (e) => e.filmYear,
	userRatingNoOver5: (e) => (e.userRatingNo !== null ? e.userRatingNo : ""),
	userRatingNoOver10: (e) => (e.userRatingNo !== null ? e.userRatingNo * 2 : ""),
	userRatingStars: (e) => e.userRatingStars,
	watchedDate: (e) => e.watchedDate,
	watchedDatetime: (e) => (e.watchedDate ? `${e.watchedDate}T00:00` : ""),
	rewatch: (e) => e.rewatch,
	link: (e) => e.link,
	tmdbId: (e) => e.tmdbId,
	posterUrl: (e) => e.posterUrl,
	guid: (e) => e.guid,
	review: (e) => e.review,
	pubDate: (e) => e.pubDate,
	containsSpoilers: (e) => e.containsSpoilers,
	tags: (e) => e.tags,
};

/**
 * Create the Letterboxd template engine
 */
const letterboxdEngine = createTemplateEngine({
	accessors: LETTERBOXD_ACCESSORS,
});

/**
 * Renders a template with the given Letterboxd entry data
 * @param template - Template string with {{variables}} and {{#if}}...{{/if}} blocks
 * @param entry - Letterboxd entry data
 * @returns Rendered template string
 */
export function renderTemplate(template: string, entry: LetterboxdEntry): string {
	return letterboxdEngine.render(template, entry);
}

/**
 * Generates a filename from the template and entry data
 * @param filenameTemplate - Filename template with {{variables}}
 * @param entry - Letterboxd entry data
 * @returns Safe filename (without .md extension)
 */
export function generateFilename(filenameTemplate: string, entry: LetterboxdEntry): string {
	return letterboxdEngine.generateFilename(filenameTemplate, entry);
}
