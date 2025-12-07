import { describe, it, expect } from "vitest";
import {
	buildImageUrl,
	formatRuntime,
	extractYear,
	templateNeedsCredits,
} from "./api";

// ============================================================================
// buildImageUrl
// ============================================================================

describe("buildImageUrl", () => {
	it("builds full URL from path and size", () => {
		expect(buildImageUrl("/abc123.jpg", "w500")).toBe(
			"https://image.tmdb.org/t/p/w500/abc123.jpg"
		);
	});

	it("returns empty string for null path", () => {
		expect(buildImageUrl(null, "w500")).toBe("");
	});

	it("handles original size", () => {
		expect(buildImageUrl("/poster.jpg", "original")).toBe(
			"https://image.tmdb.org/t/p/original/poster.jpg"
		);
	});

	it("handles various sizes", () => {
		expect(buildImageUrl("/img.jpg", "w92")).toBe(
			"https://image.tmdb.org/t/p/w92/img.jpg"
		);
		expect(buildImageUrl("/img.jpg", "w185")).toBe(
			"https://image.tmdb.org/t/p/w185/img.jpg"
		);
		expect(buildImageUrl("/img.jpg", "w780")).toBe(
			"https://image.tmdb.org/t/p/w780/img.jpg"
		);
	});
});

// ============================================================================
// formatRuntime
// ============================================================================

describe("formatRuntime", () => {
	it("returns empty string for null", () => {
		expect(formatRuntime(null)).toBe("");
	});

	it("returns empty string for 0", () => {
		expect(formatRuntime(0)).toBe("");
	});

	it("returns empty string for negative values", () => {
		expect(formatRuntime(-10)).toBe("");
	});

	it("formats minutes only (under 60)", () => {
		expect(formatRuntime(45)).toBe("45m");
	});

	it("formats hours only (exact hours)", () => {
		expect(formatRuntime(60)).toBe("1h");
		expect(formatRuntime(120)).toBe("2h");
	});

	it("formats hours and minutes", () => {
		expect(formatRuntime(90)).toBe("1h 30m");
		expect(formatRuntime(156)).toBe("2h 36m");
	});

	it("handles short films", () => {
		expect(formatRuntime(15)).toBe("15m");
	});

	it("handles long films", () => {
		expect(formatRuntime(238)).toBe("3h 58m"); // Titanic
	});
});

// ============================================================================
// extractYear
// ============================================================================

describe("extractYear", () => {
	it("extracts year from YYYY-MM-DD format", () => {
		expect(extractYear("2015-12-25")).toBe(2015);
	});

	it("returns 0 for empty string", () => {
		expect(extractYear("")).toBe(0);
	});

	it("returns 0 for null-ish string", () => {
		expect(extractYear("")).toBe(0);
	});

	it("returns 0 for short string", () => {
		expect(extractYear("202")).toBe(0);
	});

	it("handles year-only strings", () => {
		expect(extractYear("2015")).toBe(2015);
	});

	it("handles various valid dates", () => {
		expect(extractYear("1994-09-23")).toBe(1994);
		expect(extractYear("2023-01-01")).toBe(2023);
	});

	it("returns 0 for invalid year", () => {
		expect(extractYear("abcd-01-01")).toBe(0);
	});
});

// ============================================================================
// templateNeedsCredits
// ============================================================================

describe("templateNeedsCredits", () => {
	it("returns true for {{cast}}", () => {
		expect(templateNeedsCredits("Cast: {{cast}}")).toBe(true);
	});

	it("returns true for {{directors}}", () => {
		expect(templateNeedsCredits("Directed by {{directors}}")).toBe(true);
	});

	it("returns true for {{characters}}", () => {
		expect(templateNeedsCredits("{{characters}}")).toBe(true);
	});

	it("returns true for {{castWithRoles}}", () => {
		expect(templateNeedsCredits("{{castWithRoles}}")).toBe(true);
	});

	it("returns true for cast with parameters", () => {
		expect(templateNeedsCredits("{{cast yaml=true}}")).toBe(true);
	});

	it("returns true for directors with parameters", () => {
		expect(templateNeedsCredits("{{directors yaml=true link=true}}")).toBe(
			true
		);
	});

	it("returns true for castWithRoles with parameters", () => {
		expect(
			templateNeedsCredits("{{castWithRoles bullet=true linkActors=true}}")
		).toBe(true);
	});

	it("returns false for template without credits", () => {
		expect(templateNeedsCredits("{{title}} ({{year}})")).toBe(false);
	});

	it("returns false for empty template", () => {
		expect(templateNeedsCredits("")).toBe(false);
	});

	it("returns false for similar but non-matching variables", () => {
		expect(templateNeedsCredits("{{casting}}")).toBe(false);
		expect(templateNeedsCredits("{{director}}")).toBe(false);
	});

	it("handles complex templates correctly", () => {
		const template = `
---
title: {{title}}
year: {{year}}
genres: {{genres yaml=true}}
cast: {{cast yaml=true}}
---
# {{title}}
`;
		expect(templateNeedsCredits(template)).toBe(true);
	});

	it("handles template without credits", () => {
		const template = `
---
title: {{title}}
year: {{year}}
genres: {{genres yaml=true}}
---
# {{title}}
`;
		expect(templateNeedsCredits(template)).toBe(false);
	});
});
