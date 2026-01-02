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

	/** Join as comma-separated string (default) */
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

	/** Format as YAML inline array */
	yaml(): string {
		const quoted = this.items.map((item) => `"${item.replace(/"/g, '\\"')}"`);
		return `[${quoted.join(", ")}]`;
	}

	/** Format as YAML bullet list (indented for frontmatter) */
	yamlBullet(): string {
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

// ============================================================================
// Type for wrapped data objects
// ============================================================================

/** A value that can be wrapped in fluent classes */
export type FluentValue = FluentString | FluentArray | FluentNumber | FluentBoolean;

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
