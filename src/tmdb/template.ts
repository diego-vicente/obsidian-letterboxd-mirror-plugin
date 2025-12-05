import type { TMDBMovie } from "./types";
import { createTemplateEngine, wikiLink, formatArray } from "../template-engine";
import type { RawValue, TemplateParams } from "../template-engine";

/**
 * Map of template variable names to their accessor functions
 */
const TMDB_ACCESSORS: Record<string, (movie: TMDBMovie) => RawValue> = {
	// Core identifiers
	tmdbId: (m) => m.tmdbId,
	imdbId: (m) => m.imdbId,
	tmdbUrl: (m) => m.tmdbUrl,

	// Titles
	title: (m) => m.title,
	originalTitle: (m) => m.originalTitle,
	originalLanguage: (m) => m.originalLanguage,

	// Dates and timing
	year: (m) => m.year,
	releaseDate: (m) => m.releaseDate,
	runtime: (m) => m.runtime,
	runtimeFormatted: (m) => m.runtimeFormatted,

	// Content
	overview: (m) => m.overview,
	tagline: (m) => m.tagline,

	// Genres
	genres: (m) => m.genres,
	genreList: (m) => m.genreList,

	// Ratings
	tmdbRating: (m) => m.tmdbRating,
	tmdbVoteCount: (m) => m.tmdbVoteCount,

	// Financials
	budget: (m) => m.budget,
	revenue: (m) => m.revenue,

	// Poster URLs (all sizes)
	posterUrlXXS: (m) => m.posterUrlXXS,
	posterUrlXS: (m) => m.posterUrlXS,
	posterUrlS: (m) => m.posterUrlS,
	posterUrlM: (m) => m.posterUrlM,
	posterUrlL: (m) => m.posterUrlL,
	posterUrlXL: (m) => m.posterUrlXL,
	posterUrlOG: (m) => m.posterUrlOG,

	// Backdrop URLs (all sizes)
	backdropUrlS: (m) => m.backdropUrlS,
	backdropUrlM: (m) => m.backdropUrlM,
	backdropUrlL: (m) => m.backdropUrlL,
	backdropUrlOG: (m) => m.backdropUrlOG,

	// Production info
	productionCompanies: (m) => m.productionCompanies,
	productionCompanyList: (m) => m.productionCompanyList,
	spokenLanguages: (m) => m.spokenLanguages,
	spokenLanguageList: (m) => m.spokenLanguageList,
	collection: (m) => m.collection,

	// Credits
	cast: (m) => m.cast,
	characters: (m) => m.characters,
	directors: (m) => m.directors,
};

/**
 * Special handler for castWithRoles - generates "Actor as Character" strings
 * with optional linking for actors and/or characters
 */
function handleCastWithRoles(movie: TMDBMovie, params: TemplateParams): string {
	const maxItems = params.top ?? movie.cast.length;
	const roles: string[] = [];

	for (let i = 0; i < Math.min(maxItems, movie.cast.length); i++) {
		let actor = movie.cast[i];
		let character = movie.characters[i] || "";

		if (params.linkActors) {
			actor = wikiLink(actor);
		}
		if (params.linkCharacters && character) {
			character = wikiLink(character);
		}

		roles.push(`${actor} as ${character}`);
	}

	// Use formatArray but without top (already applied) and without link (already applied per-item)
	const formatParams: TemplateParams = {
		...params,
		top: undefined,
		link: undefined,
		linkActors: undefined,
		linkCharacters: undefined,
	};

	return formatArray(roles, formatParams);
}

/**
 * Create the TMDB template engine with special handlers
 */
const tmdbEngine = createTemplateEngine({
	accessors: TMDB_ACCESSORS,
	specialHandlers: {
		castWithRoles: handleCastWithRoles,
	},
});

/**
 * Renders a template with the given TMDB movie data
 * @param template - Template string with {{variables}} and {{#if}}...{{/if}} blocks
 * @param movie - TMDB movie data
 * @returns Rendered template string
 */
export function renderTMDBTemplate(template: string, movie: TMDBMovie): string {
	return tmdbEngine.render(template, movie);
}

/**
 * Generates a filename from the template and movie data
 * @param filenameTemplate - Filename template with {{variables}}
 * @param movie - TMDB movie data
 * @returns Safe filename (without .md extension)
 */
export function generateTMDBFilename(
	filenameTemplate: string,
	movie: TMDBMovie
): string {
	return tmdbEngine.generateFilename(filenameTemplate, movie);
}
