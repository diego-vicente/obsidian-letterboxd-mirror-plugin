import type { LetterboxdEntry } from "../types";
import {
	renderTemplate as etaRender,
	generateFilename as etaGenerateFilename,
} from "../eta/engine";
import { str, arr, num, bool } from "../eta/fluent";

/**
 * Wrapped Letterboxd entry data for Eta templates
 * All properties are fluent wrappers enabling chainable methods
 */
interface WrappedLetterboxdEntry {
	filmTitle: ReturnType<typeof str>;
	filmYear: ReturnType<typeof num>;
	userRatingNoOver5: ReturnType<typeof str>;
	userRatingNoOver10: ReturnType<typeof str>;
	userRatingStars: ReturnType<typeof str>;
	watchedDate: ReturnType<typeof str>;
	watchedDatetime: ReturnType<typeof str>;
	rewatch: ReturnType<typeof bool>;
	link: ReturnType<typeof str>;
	tmdbId: ReturnType<typeof str>;
	posterUrl: ReturnType<typeof str>;
	guid: ReturnType<typeof str>;
	review: ReturnType<typeof str>;
	pubDate: ReturnType<typeof str>;
	containsSpoilers: ReturnType<typeof bool>;
	tags: ReturnType<typeof arr>;
}

/**
 * Transforms a LetterboxdEntry into wrapped data for Eta templates
 */
function wrapLetterboxdEntry(entry: LetterboxdEntry): WrappedLetterboxdEntry {
	return {
		filmTitle: str(entry.filmTitle),
		filmYear: num(entry.filmYear),
		userRatingNoOver5: str(entry.userRatingNo !== null ? String(entry.userRatingNo) : ""),
		userRatingNoOver10: str(entry.userRatingNo !== null ? String(entry.userRatingNo * 2) : ""),
		userRatingStars: str(entry.userRatingStars),
		watchedDate: str(entry.watchedDate),
		watchedDatetime: str(entry.watchedDate ? `${entry.watchedDate}T00:00` : ""),
		rewatch: bool(entry.rewatch),
		link: str(entry.link),
		tmdbId: str(entry.tmdbId),
		posterUrl: str(entry.posterUrl),
		guid: str(entry.guid),
		review: str(entry.review),
		pubDate: str(entry.pubDate),
		containsSpoilers: bool(entry.containsSpoilers),
		tags: arr(entry.tags),
	};
}

/**
 * Renders a template with the given Letterboxd entry data
 * @param template - Eta template string with <%= it.variable %> syntax
 * @param entry - Letterboxd entry data
 * @returns Rendered template string
 */
export function renderTemplate(template: string, entry: LetterboxdEntry): string {
	const data = wrapLetterboxdEntry(entry);
	return etaRender(template, data);
}

/**
 * Generates a filename from the template and entry data
 * @param filenameTemplate - Eta filename template with <%= it.variable %> syntax
 * @param entry - Letterboxd entry data
 * @returns Safe filename (without .md extension)
 */
export function generateFilename(filenameTemplate: string, entry: LetterboxdEntry): string {
	const data = wrapLetterboxdEntry(entry);
	return etaGenerateFilename(filenameTemplate, data);
}
