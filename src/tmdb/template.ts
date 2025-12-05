import type { TMDBMovie } from "./types";

/**
 * Formats an array as YAML array string
 * @param arr - Array of strings
 * @returns YAML array format like ["item1", "item2"]
 */
function formatAsYamlArray(arr: string[]): string {
	if (arr.length === 0) {
		return "[]";
	}
	const quoted = arr.map((item) => `"${item.replace(/"/g, '\\"')}"`);
	return `[${quoted.join(", ")}]`;
}

/**
 * Map of template variable names to their accessor functions
 */
const VARIABLE_ACCESSORS: Record<string, (movie: TMDBMovie) => string> = {
	// Core identifiers
	tmdbId: (m) => String(m.tmdbId),
	imdbId: (m) => m.imdbId,
	tmdbUrl: (m) => m.tmdbUrl,

	// Titles
	title: (m) => m.title,
	originalTitle: (m) => m.originalTitle,
	originalLanguage: (m) => m.originalLanguage,

	// Dates and timing
	year: (m) => String(m.year),
	releaseDate: (m) => m.releaseDate,
	runtime: (m) => String(m.runtime),
	runtimeFormatted: (m) => m.runtimeFormatted,

	// Content
	overview: (m) => m.overview,
	tagline: (m) => m.tagline,

	// Genres
	genres: (m) => formatAsYamlArray(m.genres),
	genreList: (m) => m.genreList,

	// Ratings
	tmdbRating: (m) => String(m.tmdbRating),
	tmdbVoteCount: (m) => String(m.tmdbVoteCount),

	// Financials
	budget: (m) => String(m.budget),
	revenue: (m) => String(m.revenue),

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
	productionCompanies: (m) => formatAsYamlArray(m.productionCompanies),
	productionCompanyList: (m) => m.productionCompanyList,
	spokenLanguages: (m) => formatAsYamlArray(m.spokenLanguages),
	spokenLanguageList: (m) => m.spokenLanguageList,
	collection: (m) => m.collection,

	// Credits (cast and crew)
	cast: (m) => formatAsYamlArray(m.cast),
	castWithRoles: (m) => formatAsYamlArray(m.castWithRoles),
	directors: (m) => formatAsYamlArray(m.directors),
};

/** Regex pattern for simple variable substitution: {{variableName}} */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/** Regex pattern for conditional blocks: {{#if variableName}}...{{/if}} */
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

/**
 * Evaluates whether a value is "truthy" for conditional rendering
 */
function isTruthy(value: string): boolean {
	const falsyValues = ["", "false", "null", "undefined", "0", "[]"];
	return !falsyValues.includes(value.toLowerCase());
}

/**
 * Processes conditional blocks in the template
 */
function processConditionals(template: string, movie: TMDBMovie): string {
	return template.replace(
		CONDITIONAL_PATTERN,
		(_, variableName: string, content: string) => {
			const accessor = VARIABLE_ACCESSORS[variableName];
			if (!accessor) {
				return "";
			}
			const value = accessor(movie);
			return isTruthy(value) ? content : "";
		}
	);
}

/**
 * Replaces all {{variableName}} placeholders with their values
 */
function substituteVariables(template: string, movie: TMDBMovie): string {
	return template.replace(VARIABLE_PATTERN, (_, variableName: string) => {
		const accessor = VARIABLE_ACCESSORS[variableName];
		if (!accessor) {
			// Unknown variable, leave as-is for debugging
			return `{{${variableName}}}`;
		}
		return accessor(movie);
	});
}

/**
 * Renders a template with the given TMDB movie data
 * @param template - Template string with {{variables}} and {{#if}}...{{/if}} blocks
 * @param movie - TMDB movie data
 * @returns Rendered template string
 */
export function renderTMDBTemplate(template: string, movie: TMDBMovie): string {
	let result = processConditionals(template, movie);
	result = substituteVariables(result, movie);
	return result;
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
	let filename = substituteVariables(filenameTemplate, movie);

	// Sanitize filename: remove/replace characters that are invalid in filenames
	// Invalid chars: / \ : * ? " < > |
	filename = filename.replace(/[/\\:*?"<>|]/g, "");

	// Remove leading/trailing whitespace and dots
	filename = filename.trim().replace(/^\.+|\.+$/g, "");

	return filename;
}
