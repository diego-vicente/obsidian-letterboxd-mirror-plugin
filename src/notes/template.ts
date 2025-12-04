import type { LetterboxdEntry } from "../types";

/**
 * Formats tags array as YAML array string
 * @param tags - Array of tag strings
 * @returns YAML array format like ["tag1", "tag2"]
 */
function formatTagsAsYamlArray(tags: string[]): string {
	if (tags.length === 0) {
		return "[]";
	}
	const quotedTags = tags.map((tag) => `"${tag.replace(/"/g, '\\"')}"`);
	return `[${quotedTags.join(", ")}]`;
}

/**
 * Map of template variable names to their accessor functions
 */
const VARIABLE_ACCESSORS: Record<string, (entry: LetterboxdEntry) => string> = {
	filmTitle: (e) => e.filmTitle,
	filmYear: (e) => String(e.filmYear),
	userRatingNoOver5: (e) => (e.userRatingNo !== null ? String(e.userRatingNo) : ""),
	userRatingNoOver10: (e) => (e.userRatingNo !== null ? String(e.userRatingNo * 2) : ""),
	userRatingStars: (e) => e.userRatingStars,
	watchedDate: (e) => e.watchedDate,
	watchedDatetime: (e) => e.watchedDate ? `${e.watchedDate}T00:00` : "",
	rewatch: (e) => String(e.rewatch),
	link: (e) => e.link,
	tmdbId: (e) => e.tmdbId,
	posterUrl: (e) => e.posterUrl,
	guid: (e) => e.guid,
	review: (e) => e.review,
	pubDate: (e) => e.pubDate,
	containsSpoilers: (e) => String(e.containsSpoilers),
	tags: (e) => formatTagsAsYamlArray(e.tags),
};

/**
 * Regex pattern for simple variable substitution: {{variableName}}
 */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Regex pattern for conditional blocks: {{#if variableName}}...{{/if}}
 */
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

/**
 * Evaluates whether a value is "truthy" for conditional rendering
 * @param value - The value to check
 * @returns true if the value should be considered truthy
 */
function isTruthy(value: string): boolean {
	// Empty string, "false", "null", "undefined", "0" are falsy
	const falsyValues = ["", "false", "null", "undefined", "0"];
	return !falsyValues.includes(value.toLowerCase());
}

/**
 * Processes conditional blocks in the template
 * @param template - Template string with {{#if}}...{{/if}} blocks
 * @param entry - Letterboxd entry data
 * @returns Template with conditionals resolved
 */
function processConditionals(template: string, entry: LetterboxdEntry): string {
	return template.replace(CONDITIONAL_PATTERN, (_, variableName: string, content: string) => {
		const accessor = VARIABLE_ACCESSORS[variableName];
		if (!accessor) {
			// Unknown variable, remove the block
			return "";
		}

		const value = accessor(entry);
		return isTruthy(value) ? content : "";
	});
}

/**
 * Replaces all {{variableName}} placeholders with their values
 * @param template - Template string with {{variable}} placeholders
 * @param entry - Letterboxd entry data
 * @returns Template with variables substituted
 */
function substituteVariables(template: string, entry: LetterboxdEntry): string {
	return template.replace(VARIABLE_PATTERN, (_, variableName: string) => {
		const accessor = VARIABLE_ACCESSORS[variableName];
		if (!accessor) {
			// Unknown variable, leave as-is for debugging
			return `{{${variableName}}}`;
		}
		return accessor(entry);
	});
}

/**
 * Renders a template with the given Letterboxd entry data
 * @param template - Template string with {{variables}} and {{#if}}...{{/if}} blocks
 * @param entry - Letterboxd entry data
 * @returns Rendered template string
 */
export function renderTemplate(template: string, entry: LetterboxdEntry): string {
	// Process conditionals first, then substitute variables
	let result = processConditionals(template, entry);
	result = substituteVariables(result, entry);
	return result;
}

/**
 * Generates a filename from the template and entry data
 * @param filenameTemplate - Filename template with {{variables}}
 * @param entry - Letterboxd entry data
 * @returns Safe filename (without .md extension)
 */
export function generateFilename(filenameTemplate: string, entry: LetterboxdEntry): string {
	let filename = substituteVariables(filenameTemplate, entry);

	// Sanitize filename: remove/replace characters that are invalid in filenames
	// Invalid chars: / \ : * ? " < > |
	filename = filename.replace(/[/\\:*?"<>|]/g, "");

	// Remove leading/trailing whitespace and dots
	filename = filename.trim().replace(/^\.+|\.+$/g, "");

	return filename;
}
