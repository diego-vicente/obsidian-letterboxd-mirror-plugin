/**
 * Fluent wrapper classes for Eta templates
 * Enables syntax like: it.cast.top(5).link().bullet()
 */

// ============================================================================
// FluentString
// ============================================================================

export class FluentString {
	constructor(private value: string) {}

	/** Get the underlying string value */
	toString(): string {
		return this.value;
	}

	/** Get raw value for comparisons */
	valueOf(): string {
		return this.value;
	}

	/** Get native string for use with native methods */
	toNative(): string {
		return this.value;
	}

	/** Check if the string is empty */
	isEmpty(): boolean {
		return this.value === "";
	}

	/** Wrap in Obsidian wiki-link brackets */
	link(): FluentString {
		return new FluentString(`[[${this.value}]]`);
	}

	/** Apply bold formatting */
	bold(): FluentString {
		return new FluentString(`**${this.value}**`);
	}

	/** Apply italic formatting */
	italic(): FluentString {
		return new FluentString(`*${this.value}*`);
	}

	/** Wrap in YAML-safe quotes (escaping internal quotes) */
	yaml(): FluentString {
		const escaped = this.value.replace(/"/g, '\\"');
		return new FluentString(`"${escaped}"`);
	}

	/** Convert to blockquote (each line prefixed with >) */
	quote(): FluentString {
		const quoted = this.value
			.split("\n")
			.map((line) => `> ${line}`)
			.join("\n");
		return new FluentString(quoted);
	}

	/** Add prefix */
	prefix(p: string): FluentString {
		return new FluentString(p + this.value);
	}

	/** Add suffix */
	suffix(s: string): FluentString {
		return new FluentString(this.value + s);
	}

	/** Return empty string if value is empty, otherwise return value with optional wrapper */
	skipEmpty(wrapper?: (s: FluentString) => FluentString): FluentString {
		if (this.isEmpty()) {
			return this;
		}
		return wrapper ? wrapper(this) : this;
	}
}

// ============================================================================
// FluentArray
// ============================================================================

export class FluentArray {
	constructor(private items: string[]) {}

	/** Get the underlying array */
	toArray(): string[] {
		return [...this.items];
	}

	/** Get native array for use with native methods */
	toNative(): string[] {
		return [...this.items];
	}

	/** Get the length of the array */
	get length(): number {
		return this.items.length;
	}

	/** Check if the array is empty */
	isEmpty(): boolean {
		return this.items.length === 0;
	}

	/** Take first n items */
	top(n: number): FluentArray {
		return new FluentArray(this.items.slice(0, n));
	}

	/** Apply wiki-link to each item */
	link(): FluentArray {
		return new FluentArray(this.items.map((item) => `[[${item}]]`));
	}

	/** Apply bold to each item */
	bold(): FluentArray {
		return new FluentArray(this.items.map((item) => `**${item}**`));
	}

	/** Apply italic to each item */
	italic(): FluentArray {
		return new FluentArray(this.items.map((item) => `*${item}*`));
	}

	/** Map with a custom function */
	map(fn: (item: string, index: number) => string): FluentArray {
		return new FluentArray(this.items.map(fn));
	}

	/** Filter items */
	filter(fn: (item: string, index: number) => boolean): FluentArray {
		return new FluentArray(this.items.filter(fn));
	}

	// ========================================================================
	// Terminal operations (return string)
	// ========================================================================

	/** Join as comma-separated string (default when used in string context) */
	toString(): string {
		return this.items.join(", ");
	}

	/** Join with custom separator */
	join(separator: string): string {
		return this.items.join(separator);
	}

	/** Format as markdown bullet list */
	bullet(): string {
		return this.items.map((item) => `- ${item}`).join("\n");
	}

	/**
	 * Format as YAML inline array
	 * @example yaml() // ["A", "B", "C"]
	 */
	yaml(): string {
		const quoted = this.items.map((item) => `"${item.replace(/"/g, '\\"')}"`);
		return `[${quoted.join(", ")}]`;
	}

	/**
	 * Format as YAML multiline list (indented for frontmatter)
	 * @example yamlMultiline() //   - A
	 *                          //   - B
	 */
	yamlMultiline(): string {
		return this.items.map((item) => `  - ${item}`).join("\n");
	}
}

// ============================================================================
// FluentNumber
// ============================================================================

export class FluentNumber {
	constructor(private value: number) {}

	/** Get the underlying number */
	valueOf(): number {
		return this.value;
	}

	/** Convert to string */
	toString(): string {
		return String(this.value);
	}

	/** Get native number for use with native methods */
	toNative(): number {
		return this.value;
	}

	/** Check if zero */
	isZero(): boolean {
		return this.value === 0;
	}

	/** Multiply by a factor */
	times(factor: number): FluentNumber {
		return new FluentNumber(this.value * factor);
	}

	/** Add prefix */
	prefix(p: string): FluentString {
		return new FluentString(p + String(this.value));
	}

	/** Add suffix */
	suffix(s: string): FluentString {
		return new FluentString(String(this.value) + s);
	}

	/** Format with fixed decimal places */
	fixed(digits: number): FluentString {
		return new FluentString(this.value.toFixed(digits));
	}
}

// ============================================================================
// FluentBoolean
// ============================================================================

export class FluentBoolean {
	constructor(private value: boolean) {}

	/** Get the underlying boolean */
	valueOf(): boolean {
		return this.value;
	}

	/** Convert to string */
	toString(): string {
		return String(this.value);
	}

	/** Get native boolean for use with native methods */
	toNative(): boolean {
		return this.value;
	}

	/** Check if true */
	isTrue(): boolean {
		return this.value === true;
	}

	/** Check if false */
	isFalse(): boolean {
		return this.value === false;
	}

	/** Return one value if true, another if false */
	ifElse<T>(trueValue: T, falseValue: T): T {
		return this.value ? trueValue : falseValue;
	}
}

// ============================================================================
// FluentRating
// ============================================================================

/** Base scale for Letterboxd ratings (0-5 with half-star increments) */
const LETTERBOXD_RATING_BASE = 5;

/** Star characters for rating display */
const STAR_FULL = "★";
const STAR_HALF = "½";

export class FluentRating {
	constructor(private value: number | null) {}

	/** Get the underlying rating value (0-5 scale), null if unrated */
	valueOf(): number | null {
		return this.value;
	}

	/** Convert to string (empty string if unrated) */
	toString(): string {
		return this.value !== null ? String(this.value) : "";
	}

	/** Get native value for use with native methods */
	toNative(): number | null {
		return this.value;
	}

	/** Check if the entry has a rating */
	isRated(): boolean {
		return this.value !== null;
	}

	/** Check if unrated */
	isUnrated(): boolean {
		return this.value === null;
	}

	/**
	 * Scale rating to a different base
	 * @param base - Target scale (e.g., 10, 100)
	 * @returns FluentNumber with scaled value, or 0 if unrated
	 * @example rating.over(10) // 3.5 → 7
	 * @example rating.over(100) // 3.5 → 70
	 */
	over(base: number): FluentNumber {
		if (this.value === null) {
			return new FluentNumber(0);
		}
		const scaled = (this.value / LETTERBOXD_RATING_BASE) * base;
		return new FluentNumber(scaled);
	}

	/**
	 * Convert rating to star representation
	 * @returns FluentString with stars (e.g., "★★★½"), empty if unrated
	 * @example rating.stars() // 3.5 → "★★★½"
	 */
	stars(): FluentString {
		if (this.value === null) {
			return new FluentString("");
		}

		const fullStars = Math.floor(this.value);
		const hasHalf = this.value % 1 !== 0;

		let result = STAR_FULL.repeat(fullStars);
		if (hasHalf) {
			result += STAR_HALF;
		}

		return new FluentString(result);
	}
}

// ============================================================================
// FluentImage
// ============================================================================

/** TMDB image base URL */
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/** Poster size mappings: name → TMDB code, pixels → TMDB code */
const POSTER_SIZE_MAP: Record<string, string> = {
	// Named sizes
	XXS: "w92",
	XS: "w154",
	S: "w185",
	M: "w342",
	L: "w500",
	XL: "w780",
	OG: "original",
	// Pixel sizes (as strings for lookup)
	"92": "w92",
	"154": "w154",
	"185": "w185",
	"342": "w342",
	"500": "w500",
	"780": "w780",
};

/** Backdrop size mappings: name → TMDB code, pixels → TMDB code */
const BACKDROP_SIZE_MAP: Record<string, string> = {
	// Named sizes
	S: "w300",
	M: "w780",
	L: "w1280",
	OG: "original",
	// Pixel sizes (as strings for lookup)
	"300": "w300",
	"780": "w780",
	"1280": "w1280",
};

/** Default sizes for each image type */
const DEFAULT_POSTER_SIZE = "w500"; // L
const DEFAULT_BACKDROP_SIZE = "w1280"; // L

/** Image type determines which size map to use */
export type ImageType = "poster" | "backdrop";

/**
 * Fluent wrapper for TMDB image paths
 * Enables syntax like: it.poster.size("L") or it.poster.size(500)
 */
export class FluentImage {
	private sizeMap: Record<string, string>;
	private defaultSize: string;

	/**
	 * @param path - Image path from TMDB (e.g., "/abc123.jpg") or empty string
	 * @param type - Image type ("poster" or "backdrop")
	 */
	constructor(
		private path: string,
		private type: ImageType
	) {
		if (type === "poster") {
			this.sizeMap = POSTER_SIZE_MAP;
			this.defaultSize = DEFAULT_POSTER_SIZE;
		} else {
			this.sizeMap = BACKDROP_SIZE_MAP;
			this.defaultSize = DEFAULT_BACKDROP_SIZE;
		}
	}

	/** Check if image path is empty */
	isEmpty(): boolean {
		return this.path === "";
	}

	/** Get the raw path (without base URL) */
	toNative(): string {
		return this.path;
	}

	/**
	 * Get full image URL at specified size
	 * @param size - Size name ("S", "M", "L", "XL", "OG") or pixel width (92, 500, etc.)
	 * @returns FluentString with full URL, or empty string if no image
	 * @example poster.size("L")     // https://image.tmdb.org/t/p/w500/path.jpg
	 * @example poster.size(500)     // https://image.tmdb.org/t/p/w500/path.jpg
	 * @example poster.size("OG")    // https://image.tmdb.org/t/p/original/path.jpg
	 */
	size(size: string | number): FluentString {
		if (this.path === "") {
			return new FluentString("");
		}

		const sizeKey = String(size).toUpperCase();
		const tmdbSize = this.sizeMap[sizeKey] || this.sizeMap[String(size)] || this.defaultSize;

		return new FluentString(`${TMDB_IMAGE_BASE_URL}/${tmdbSize}${this.path}`);
	}

	/** Get URL at default size (L for posters, L for backdrops) */
	toString(): string {
		if (this.path === "") {
			return "";
		}
		return `${TMDB_IMAGE_BASE_URL}/${this.defaultSize}${this.path}`;
	}

	/** Alias for default size URL */
	url(): FluentString {
		return new FluentString(this.toString());
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

/** Wrap a string value */
export function str(value: string): FluentString {
	return new FluentString(value);
}

/** Wrap an array of strings */
export function arr(value: string[]): FluentArray {
	return new FluentArray(value);
}

/** Wrap a number value */
export function num(value: number): FluentNumber {
	return new FluentNumber(value);
}

/** Wrap a boolean value */
export function bool(value: boolean): FluentBoolean {
	return new FluentBoolean(value);
}

/** Wrap a rating value (number 0-5 or null if unrated) */
export function rating(value: number | null): FluentRating {
	return new FluentRating(value);
}

/** Wrap an image path as poster */
export function poster(path: string): FluentImage {
	return new FluentImage(path, "poster");
}

/** Wrap an image path as backdrop */
export function backdrop(path: string): FluentImage {
	return new FluentImage(path, "backdrop");
}

// ============================================================================
// Type for wrapped data objects
// ============================================================================

/** A value that can be wrapped in fluent classes */
export type FluentValue =
	| FluentString
	| FluentArray
	| FluentNumber
	| FluentBoolean
	| FluentRating
	| FluentImage;

/** Wrap a raw value in the appropriate fluent class */
export function wrap(value: string | number | boolean | string[]): FluentValue {
	if (Array.isArray(value)) {
		return arr(value);
	}
	if (typeof value === "string") {
		return str(value);
	}
	if (typeof value === "number") {
		return num(value);
	}
	if (typeof value === "boolean") {
		return bool(value);
	}
	// Fallback for null/undefined - return empty string
	return str("");
}
