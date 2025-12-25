/**
 * Shared template engine for rendering templates with {{variable param=value}} syntax
 */

// ============================================================================
// Types
// ============================================================================

/** Parsed template parameters */
export interface TemplateParams {
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

/** Raw value type - can be string, number, boolean, or string array */
export type RawValue = string | number | boolean | string[];

/** Accessor function that extracts a raw value from data */
export type ValueAccessor<T> = (data: T) => RawValue;

/** Special handler for complex variables like castWithRoles */
export type SpecialHandler<T> = (data: T, params: TemplateParams) => string;

/** Configuration for the template engine */
export interface TemplateEngineConfig<T> {
	/** Map of variable names to accessor functions */
	accessors: Record<string, ValueAccessor<T>>;
	/** Optional special handlers for complex variables */
	specialHandlers?: Record<string, SpecialHandler<T>>;
}

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

/** Regex pattern for conditional blocks: {{#if variableName}}...{{/if}} */
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

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
			case "bold":
				params.bold = value === "true";
				break;
			case "italic":
				params.italic = value === "true";
				break;
			case "skipEmpty":
				params.skipEmpty = value === "true";
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
// Value Formatting
// ============================================================================

/**
 * Checks if a value is empty
 */
function isEmpty(value: RawValue): boolean {
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "string") return value === "";
	if (typeof value === "boolean") return false;
	if (typeof value === "number") return false;
	return true;
}

/**
 * Wraps a string in wiki-link brackets
 */
function wikiLink(s: string): string {
	return `[[${s}]]`;
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
		// Note: bold/italic parameters are ignored when yaml=true (incompatible)
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

	// For strings, yaml=true means wrap in quotes
	// Note: bold/italic parameters are ignored when yaml=true (incompatible)
	if (params.yaml) {
		return `"${result.replace(/"/g, '\\"')}"`;
	}

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

/**
 * Formats a raw value according to the given parameters
 * @param value - Raw value (string, number, boolean, or array)
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
	} else if (typeof value === "boolean") {
		result = String(value);
	} else {
		result = formatString(value, params);
	}

	// Apply prefix/suffix (only if result is not empty, or skipEmpty is not set)
	if (result !== "" || !params.skipEmpty) {
		if (params.prefix) result = params.prefix + result;
		if (params.suffix) result = result + params.suffix;
	}

	return result;
}

// ============================================================================
// Template Engine
// ============================================================================

/**
 * Evaluates whether a value is "truthy" for conditional rendering
 */
function isTruthy(value: RawValue): boolean {
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "number") return value !== 0;
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		const falsyStrings = ["", "false", "null", "undefined"];
		return !falsyStrings.includes(value.toLowerCase());
	}
	return false;
}

/**
 * Creates a template engine with the given configuration
 * @param config - Configuration with accessors and optional special handlers
 * @returns Object with render and generateFilename functions
 */
export function createTemplateEngine<T>(config: TemplateEngineConfig<T>) {
	const { accessors, specialHandlers = {} } = config;

	/**
	 * Processes conditional blocks in the template
	 */
	function processConditionals(template: string, data: T): string {
		return template.replace(CONDITIONAL_PATTERN, (_, variableName: string, content: string) => {
			// Check special handlers first
			if (specialHandlers[variableName]) {
				// For special handlers, check if the underlying data exists
				// This is a simplification - assume truthy if handler exists
				return content;
			}

			const accessor = accessors[variableName];
			if (!accessor) {
				return "";
			}
			const value = accessor(data);
			return isTruthy(value) ? content : "";
		});
	}

	/**
	 * Substitutes all variables with their formatted values
	 */
	function substituteVariables(template: string, data: T): string {
		return template.replace(
			VARIABLE_WITH_PARAMS_PATTERN,
			(match, variableName: string, paramString: string | undefined) => {
				const params = parseParams(paramString);

				// Check special handlers first
				const specialHandler = specialHandlers[variableName];
				if (specialHandler) {
					const result = specialHandler(data, params);
					// Apply skipEmpty check
					if (params.skipEmpty && result === "") {
						return "";
					}
					// Apply prefix/suffix
					let finalResult = result;
					if (params.prefix) finalResult = params.prefix + finalResult;
					if (params.suffix) finalResult = finalResult + params.suffix;
					return finalResult;
				}

				const accessor = accessors[variableName];
				if (!accessor) {
					// Unknown variable, leave as-is for debugging
					return match;
				}

				const value = accessor(data);
				return formatValue(value, params);
			}
		);
	}

	/**
	 * Renders a template with the given data
	 */
	function render(template: string, data: T): string {
		let result = processConditionals(template, data);
		result = substituteVariables(result, data);
		return result;
	}

	/**
	 * Generates a safe filename from a template
	 */
	function generateFilename(template: string, data: T): string {
		let filename = substituteVariables(template, data);

		// Sanitize filename: remove/replace characters that are invalid in filenames
		// Invalid chars: / \ : * ? " < > |
		filename = filename.replace(/[/\\:*?"<>|]/g, "");

		// Remove leading/trailing whitespace and dots
		filename = filename.trim().replace(/^\.+|\.+$/g, "");

		return filename;
	}

	return { render, generateFilename };
}

// ============================================================================
// Utility Exports
// ============================================================================

export { formatArray, formatValue, parseParams, wikiLink };
