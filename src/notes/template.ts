import type { LetterboxdEntry } from "../types";
import {
	renderTemplate as etaRender,
	generateFilename as etaGenerateFilename,
} from "../eta/engine";
import { str, arr, num, bool, rating } from "../eta/fluent";
import type {
	FluentString,
	FluentNumber,
	FluentBoolean,
	FluentArray,
	FluentRating,
} from "../eta/fluent";

/**
 * Wrapped Letterboxd entry data for Eta templates
 * All properties are fluent wrappers enabling chainable methods
 */
interface WrappedLetterboxdEntry {
	filmTitle: FluentString;
	filmYear: FluentNumber;
	/** User rating with .over(base) and .stars() methods */
	userRating: FluentRating;
	watchedDate: FluentString;
	watchedDatetime: FluentString;
	rewatch: FluentBoolean;
	link: FluentString;
	tmdbId: FluentString;
	posterUrl: FluentString;
	guid: FluentString;
	review: FluentString;
	pubDate: FluentString;
	containsSpoilers: FluentBoolean;
	tags: FluentArray;
}

/**
 * Transforms a LetterboxdEntry into wrapped data for Eta templates
 */
function wrapLetterboxdEntry(entry: LetterboxdEntry): WrappedLetterboxdEntry {
	return {
		filmTitle: str(entry.filmTitle),
		filmYear: num(entry.filmYear),
		userRating: rating(entry.userRatingNo),
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
