/**
 * Eta-based template engine with fluent wrapper support
 */

import { Eta } from "eta";
import {
	FluentString,
	FluentArray,
	FluentNumber,
	FluentBoolean,
	FluentRating,
	str,
	arr,
	num,
	bool,
	rating,
} from "./fluent";

// ============================================================================
// Types
// ============================================================================

/** Raw value types that can be wrapped */
export type RawValue = string | number | boolean | string[];

/** Configuration for data transformation */
export interface DataTransformer<TInput, TOutput> {
	transform: (input: TInput) => TOutput;
}

// ============================================================================
// Eta Instance
// ============================================================================

/** Shared Eta instance configured for string-based rendering */
const eta = new Eta({
	// Don't auto-escape HTML - we want raw output for Markdown
	autoEscape: false,
	// Don't auto-trim whitespace around tags - preserve template formatting
	autoTrim: false,
	// Use 'it' as the data variable name (Eta default)
	varName: "it",
	// Inject helper functions into every template
	functionHeader: `
		const str = this.str;
		const arr = this.arr;
		const num = this.num;
		const bool = this.bool;
	`,
});

// Attach helper functions to Eta instance so they're available via functionHeader
(eta as unknown as Record<string, unknown>).str = str;
(eta as unknown as Record<string, unknown>).arr = arr;
(eta as unknown as Record<string, unknown>).num = num;
(eta as unknown as Record<string, unknown>).bool = bool;

// ============================================================================
// Template Engine
// ============================================================================

/**
 * Renders a template string with the given data
 * @param template - Eta template string
 * @param data - Data object to pass to the template
 * @returns Rendered string
 */
export function renderTemplate<T extends object>(template: string, data: T): string {
	return eta.renderString(template, data);
}

/**
 * Generates a safe filename from a template
 * @param template - Eta template for filename
 * @param data - Data object to pass to the template
 * @returns Sanitized filename (without extension)
 */
export function generateFilename<T extends object>(template: string, data: T): string {
	let filename = eta.renderString(template, data);

	// Sanitize: remove characters invalid in filenames
	// Invalid chars: / \ : * ? " < > |
	const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g;
	filename = filename.replace(INVALID_FILENAME_CHARS, "");

	// Remove leading/trailing whitespace and dots
	const LEADING_TRAILING_DOTS = /^\.+|\.+$/g;
	filename = filename.trim().replace(LEADING_TRAILING_DOTS, "");

	return filename;
}

// ============================================================================
// Data Wrapping Utilities
// ============================================================================

/**
 * Type helper for wrapped data objects
 * Converts raw types to their fluent equivalents
 */
export type Wrapped<T> = {
	[K in keyof T]: T[K] extends string[]
		? FluentArray
		: T[K] extends string
			? FluentString
			: T[K] extends number
				? FluentNumber
				: T[K] extends boolean
					? FluentBoolean
					: T[K];
};

/**
 * Wraps all properties of an object with fluent wrappers
 * @param obj - Object with raw values
 * @returns Object with fluent-wrapped values
 */
export function wrapData<T extends Record<string, RawValue | null | undefined>>(
	obj: T
): Wrapped<T> {
	const result: Record<string, unknown> = {};

	for (const key of Object.keys(obj)) {
		const value = obj[key];

		if (value === null || value === undefined) {
			// Wrap null/undefined as empty string
			result[key] = str("");
		} else if (Array.isArray(value)) {
			result[key] = arr(value);
		} else if (typeof value === "string") {
			result[key] = str(value);
		} else if (typeof value === "number") {
			result[key] = num(value);
		} else if (typeof value === "boolean") {
			result[key] = bool(value);
		} else {
			// Pass through unknown types
			result[key] = value;
		}
	}

	return result as Wrapped<T>;
}

// ============================================================================
// Exports
// ============================================================================

export {
	eta,
	FluentString,
	FluentArray,
	FluentNumber,
	FluentBoolean,
	FluentRating,
	str,
	arr,
	num,
	bool,
	rating,
};
