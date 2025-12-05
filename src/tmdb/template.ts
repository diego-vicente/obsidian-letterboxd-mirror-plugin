import type { TMDBMovie } from "./types";

// ============================================================================
// Types
// ============================================================================

/** Parsed template parameters */
interface TemplateParams {
	top?: number;
	yaml?: boolean;
	bullet?: boolean;
	quote?: boolean;
	bold?: boolean;
	italic?: boolean;
	skipEmpty?: boolean;
	prefix?: string;
	suffix?: string;
	link?: boolean;
	linkActors?: boolean;
	linkCharacters?: boolean;
}

/** Raw value type - can be string, number, or string array */
type RawValue = string | number | string[];

// ============================================================================
// Parameter Parsing
// ============================================================================

/**
 * Regex to match variable with optional parameters:
 * {{variableName}} or {{variableName param1="value" param2=true}}
 */
const VARIABLE_WITH_PARAMS_PATTERN = /\{\{(\w+)(\s+[^}]+)?\}\}/g;

/**
 * Regex to parse individual parameters: key="value" or key=value
 * Supports: param=true, param=false, param=123, param="string value"
 */
const PARAM_PATTERN = /(\w+)=(?:"([^"]*)"|(\S+))/g;

/**
 * Parses parameter string into TemplateParams object
 * @param paramString - String like ' top=5 yaml=true prefix="- "'
 * @returns Parsed parameters
 */
function parseParams(paramString: string | undefined): TemplateParams {
	const params: TemplateParams = {};
	if (!paramString) return params;

	let match;
	while ((match = PARAM_PATTERN.exec(paramString)) !== null) {
		const key = match[1];
		const value = match[2] !== undefined ? match[2] : match[3];

		switch (key) {
			case "top":
				params.top = parseInt(value, 10);
				break;
			case "yaml":
				params.yaml = value === "true";
				break;
			case "bullet":
				params.bullet = value === "true";
				break;
			case "quote":
				params.quote = value === "true";
				break;
			case "skipEmpty":
				params.skipEmpty = value === "true";
				break;
			case "bold":
				params.bold = value === "true";
				break;
			case "italic":
				params.italic = value === "true";
				break;
			case "prefix":
				params.prefix = value;
				break;
			case "suffix":
				params.suffix = value;
				break;
			case "link":
				params.link = value === "true";
				break;
			case "linkActors":
				params.linkActors = value === "true";
				break;
			case "linkCharacters":
				params.linkCharacters = value === "true";
				break;
		}
	}

	return params;
}

// ============================================================================
// Raw Value Accessors
// ============================================================================

/**
 * Map of variable names to functions that return raw values (before formatting)
 * Arrays are returned as arrays, strings as strings
 */
const RAW_VALUE_ACCESSORS: Record<string, (movie: TMDBMovie) => RawValue> = {
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

// ============================================================================
// Value Formatting
// ============================================================================

/**
 * Checks if a value is empty
 */
function isEmpty(value: RawValue): boolean {
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "string") return value === "";
	if (typeof value === "number") return false; // Numbers are never empty
	return true;
}

/**
 * Wraps a string in wiki-link brackets
 */
function wikiLink(s: string): string {
	return `[[${s}]]`;
}

/**
 * Formats a raw value according to the given parameters
 * @param value - Raw value (string, number, or array)
 * @param params - Formatting parameters
 * @returns Formatted string
 */
function formatValue(value: RawValue, params: TemplateParams): string {
	// Handle skipEmpty
	if (params.skipEmpty && isEmpty(value)) {
		return "";
	}

	let result: string;

	if (Array.isArray(value)) {
		result = formatArray(value, params);
	} else if (typeof value === "number") {
		result = String(value);
	} else {
		result = formatString(value, params);
	}

	// Apply prefix/suffix
	if (result !== "" || !params.skipEmpty) {
		if (params.prefix) result = params.prefix + result;
		if (params.suffix) result = result + params.suffix;
	}

	return result;
}

/**
 * Applies text formatting (bold/italic) to a string
 */
function applyTextFormatting(str: string, params: TemplateParams): string {
	let result = str;
	if (params.bold) {
		result = `**${result}**`;
	}
	if (params.italic) {
		result = `*${result}*`;
	}
	return result;
}

/**
 * Formats an array according to parameters
 */
function formatArray(arr: string[], params: TemplateParams): string {
	let items = [...arr];

	// Apply top filter
	if (params.top !== undefined && params.top > 0) {
		items = items.slice(0, params.top);
	}

	// Apply link to each item
	if (params.link) {
		items = items.map(wikiLink);
	}

	// Format based on output type
	if (params.yaml) {
		// Warn if bold/italic used with yaml (incompatible)
		if (params.bold || params.italic) {
			console.warn("TMDB Template: bold/italic parameters are ignored when yaml=true");
		}
		if (params.bullet) {
			// YAML bullet list (indented)
			return items.map((item) => `  - ${item}`).join("\n");
		} else {
			// YAML inline array
			const quoted = items.map((item) => `"${item.replace(/"/g, '\\"')}"`);
			return `[${quoted.join(", ")}]`;
		}
	}

	// Apply bold/italic to each item (only for non-YAML output)
	if (params.bold || params.italic) {
		items = items.map((item) => applyTextFormatting(item, params));
	}

	if (params.bullet) {
		// Markdown bullet list
		return items.map((item) => `- ${item}`).join("\n");
	} else {
		// Default: comma-separated
		return items.join(", ");
	}
}

/**
 * Formats a string according to parameters
 */
function formatString(str: string, params: TemplateParams): string {
	let result = str;

	// Apply bold/italic first (before quote, so formatting is inside the quote)
	if (params.bold) {
		result = `**${result}**`;
	}
	if (params.italic) {
		result = `*${result}*`;
	}

	// Apply quote (wraps the already formatted text)
	if (params.quote) {
		result = result
			.split("\n")
			.map((line) => `> ${line}`)
			.join("\n");
	}

	// Apply link
	if (params.link) {
		result = wikiLink(result);
	}

	return result;
}

// ============================================================================
// Special Variable: castWithRoles
// ============================================================================

/**
 * Generates castWithRoles dynamically with link options
 */
function getCastWithRoles(movie: TMDBMovie, params: TemplateParams): string[] {
	const result: string[] = [];
	const maxItems = params.top ?? movie.cast.length;

	for (let i = 0; i < Math.min(maxItems, movie.cast.length); i++) {
		let actor = movie.cast[i];
		let character = movie.characters[i] || "";

		if (params.linkActors) {
			actor = wikiLink(actor);
		}
		if (params.linkCharacters && character) {
			character = wikiLink(character);
		}

		result.push(`${actor} as ${character}`);
	}

	return result;
}

// ============================================================================
// Template Processing
// ============================================================================

/** Regex pattern for conditional blocks: {{#if variableName}}...{{/if}} */
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

/**
 * Evaluates whether a value is "truthy" for conditional rendering
 */
function isTruthy(value: RawValue): boolean {
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "string") {
		const falsyStrings = ["", "false", "null", "undefined"];
		return !falsyStrings.includes(value.toLowerCase());
	}
	return false;
}

/**
 * Processes conditional blocks in the template
 */
function processConditionals(template: string, movie: TMDBMovie): string {
	return template.replace(
		CONDITIONAL_PATTERN,
		(_, variableName: string, content: string) => {
			const accessor = RAW_VALUE_ACCESSORS[variableName];
			if (!accessor) {
				// Special case: castWithRoles
				if (variableName === "castWithRoles") {
					return movie.cast.length > 0 ? content : "";
				}
				return "";
			}
			const value = accessor(movie);
			return isTruthy(value) ? content : "";
		}
	);
}

/**
 * Substitutes all variables with their formatted values
 */
function substituteVariables(template: string, movie: TMDBMovie): string {
	return template.replace(
		VARIABLE_WITH_PARAMS_PATTERN,
		(match, variableName: string, paramString: string | undefined) => {
			const params = parseParams(paramString);

			// Special case: castWithRoles with link options
			if (variableName === "castWithRoles") {
				const roles = getCastWithRoles(movie, params);
				// Remove top from params since we already applied it
				const formatParams = { ...params, top: undefined };
				return formatArray(roles, formatParams);
			}

			const accessor = RAW_VALUE_ACCESSORS[variableName];
			if (!accessor) {
				// Unknown variable, leave as-is for debugging
				return match;
			}

			const value = accessor(movie);
			return formatValue(value, params);
		}
	);
}

// ============================================================================
// Public API
// ============================================================================

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
