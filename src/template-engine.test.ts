import { describe, it, expect } from "vitest";
import {
	parseParams,
	formatValue,
	formatArray,
	wikiLink,
	createTemplateEngine,
} from "./template-engine";

// ============================================================================
// parseParams
// ============================================================================

describe("parseParams", () => {
	it("returns empty object for undefined input", () => {
		expect(parseParams(undefined)).toEqual({});
	});

	it("returns empty object for empty string", () => {
		expect(parseParams("")).toEqual({});
	});

	it("parses top parameter as number", () => {
		expect(parseParams(" top=5")).toEqual({ top: 5 });
	});

	it("parses boolean parameters (true)", () => {
		expect(parseParams(" yaml=true")).toEqual({ yaml: true });
		expect(parseParams(" bullet=true")).toEqual({ bullet: true });
		expect(parseParams(" quote=true")).toEqual({ quote: true });
		expect(parseParams(" bold=true")).toEqual({ bold: true });
		expect(parseParams(" italic=true")).toEqual({ italic: true });
		expect(parseParams(" skipEmpty=true")).toEqual({ skipEmpty: true });
		expect(parseParams(" link=true")).toEqual({ link: true });
	});

	it("parses boolean parameters (false)", () => {
		expect(parseParams(" yaml=false")).toEqual({ yaml: false });
	});

	it("parses quoted string parameters", () => {
		expect(parseParams(' prefix="- "')).toEqual({ prefix: "- " });
		expect(parseParams(' suffix="!"')).toEqual({ suffix: "!" });
	});

	it("parses unquoted string parameters", () => {
		expect(parseParams(" prefix=-")).toEqual({ prefix: "-" });
	});

	it("parses multiple parameters", () => {
		expect(parseParams(" top=3 yaml=true link=true")).toEqual({
			top: 3,
			yaml: true,
			link: true,
		});
	});

	it("parses linkActors and linkCharacters", () => {
		expect(parseParams(" linkActors=true linkCharacters=true")).toEqual({
			linkActors: true,
			linkCharacters: true,
		});
	});
});

// ============================================================================
// wikiLink
// ============================================================================

describe("wikiLink", () => {
	it("wraps string in double brackets", () => {
		expect(wikiLink("Test")).toBe("[[Test]]");
	});

	it("handles strings with spaces", () => {
		expect(wikiLink("Film Title")).toBe("[[Film Title]]");
	});

	it("handles empty string", () => {
		expect(wikiLink("")).toBe("[[]]");
	});
});

// ============================================================================
// formatArray
// ============================================================================

describe("formatArray", () => {
	const testArray = ["Apple", "Banana", "Cherry", "Date"];

	it("returns comma-separated by default", () => {
		expect(formatArray(testArray, {})).toBe("Apple, Banana, Cherry, Date");
	});

	it("respects top parameter", () => {
		expect(formatArray(testArray, { top: 2 })).toBe("Apple, Banana");
	});

	it("applies link to each item", () => {
		expect(formatArray(["A", "B"], { link: true })).toBe("[[A]], [[B]]");
	});

	it("formats as YAML inline array", () => {
		expect(formatArray(["A", "B"], { yaml: true })).toBe('["A", "B"]');
	});

	it("escapes quotes in YAML inline array", () => {
		expect(formatArray(['Say "Hello"'], { yaml: true })).toBe('["Say \\"Hello\\""]');
	});

	it("formats as YAML bullet list", () => {
		expect(formatArray(["A", "B"], { yaml: true, bullet: true })).toBe("  - A\n  - B");
	});

	it("formats as markdown bullet list", () => {
		expect(formatArray(["A", "B"], { bullet: true })).toBe("- A\n- B");
	});

	it("applies bold to each item (non-YAML)", () => {
		expect(formatArray(["A", "B"], { bold: true })).toBe("**A**, **B**");
	});

	it("applies italic to each item (non-YAML)", () => {
		expect(formatArray(["A", "B"], { italic: true })).toBe("*A*, *B*");
	});

	it("applies both link and top", () => {
		expect(formatArray(testArray, { top: 2, link: true })).toBe("[[Apple]], [[Banana]]");
	});

	it("handles empty array", () => {
		expect(formatArray([], {})).toBe("");
	});
});

// ============================================================================
// formatValue
// ============================================================================

describe("formatValue", () => {
	describe("with string values", () => {
		it("returns string as-is by default", () => {
			expect(formatValue("hello", {})).toBe("hello");
		});

		it("applies bold", () => {
			expect(formatValue("hello", { bold: true })).toBe("**hello**");
		});

		it("applies italic", () => {
			expect(formatValue("hello", { italic: true })).toBe("*hello*");
		});

		it("applies both bold and italic", () => {
			expect(formatValue("hello", { bold: true, italic: true })).toBe("***hello***");
		});

		it("applies quote to single line", () => {
			expect(formatValue("hello", { quote: true })).toBe("> hello");
		});

		it("applies quote to multi-line", () => {
			expect(formatValue("line1\nline2", { quote: true })).toBe("> line1\n> line2");
		});

		it("applies link", () => {
			expect(formatValue("hello", { link: true })).toBe("[[hello]]");
		});

		it("wraps in quotes for yaml", () => {
			expect(formatValue("hello", { yaml: true })).toBe('"hello"');
		});

		it("escapes quotes in yaml", () => {
			expect(formatValue('say "hi"', { yaml: true })).toBe('"say \\"hi\\""');
		});

		it("applies prefix", () => {
			expect(formatValue("hello", { prefix: "!" })).toBe("!hello");
		});

		it("applies suffix", () => {
			expect(formatValue("hello", { suffix: "!" })).toBe("hello!");
		});

		it("applies both prefix and suffix", () => {
			expect(formatValue("hello", { prefix: "[", suffix: "]" })).toBe("[hello]");
		});
	});

	describe("with number values", () => {
		it("converts number to string", () => {
			expect(formatValue(42, {})).toBe("42");
		});

		it("handles decimals", () => {
			expect(formatValue(3.5, {})).toBe("3.5");
		});

		it("applies prefix/suffix to numbers", () => {
			expect(formatValue(5, { prefix: "Rating: ", suffix: "/10" })).toBe("Rating: 5/10");
		});
	});

	describe("with boolean values", () => {
		it("converts true to string", () => {
			expect(formatValue(true, {})).toBe("true");
		});

		it("converts false to string", () => {
			expect(formatValue(false, {})).toBe("false");
		});
	});

	describe("with array values", () => {
		it("formats arrays correctly", () => {
			expect(formatValue(["A", "B"], {})).toBe("A, B");
		});

		it("applies array-specific formatting", () => {
			expect(formatValue(["A", "B"], { yaml: true })).toBe('["A", "B"]');
		});
	});

	describe("with skipEmpty", () => {
		it("returns empty string for empty string when skipEmpty=true", () => {
			expect(formatValue("", { skipEmpty: true })).toBe("");
		});

		it("returns empty string for empty array when skipEmpty=true", () => {
			expect(formatValue([], { skipEmpty: true })).toBe("");
		});

		it("does not skip false boolean with skipEmpty=true", () => {
			expect(formatValue(false, { skipEmpty: true })).toBe("false");
		});

		it("does not skip zero with skipEmpty=true", () => {
			expect(formatValue(0, { skipEmpty: true })).toBe("0");
		});

		it("does not apply prefix/suffix when value is empty and skipEmpty=true", () => {
			expect(formatValue("", { skipEmpty: true, prefix: "[", suffix: "]" })).toBe("");
		});
	});
});

// ============================================================================
// createTemplateEngine
// ============================================================================

describe("createTemplateEngine", () => {
	interface TestData {
		title: string;
		year: number;
		rating: number | null;
		tags: string[];
		isRewatch: boolean;
	}

	const testData: TestData = {
		title: "The Revenant",
		year: 2015,
		rating: 3.5,
		tags: ["drama", "survival"],
		isRewatch: false,
	};

	const engine = createTemplateEngine<TestData>({
		accessors: {
			title: (d) => d.title,
			year: (d) => d.year,
			rating: (d) => d.rating ?? "",
			tags: (d) => d.tags,
			isRewatch: (d) => d.isRewatch,
		},
	});

	describe("render", () => {
		it("substitutes simple variables", () => {
			expect(engine.render("{{title}} ({{year}})", testData)).toBe("The Revenant (2015)");
		});

		it("substitutes variable with parameters", () => {
			expect(engine.render("{{tags yaml=true}}", testData)).toBe('["drama", "survival"]');
		});

		it("handles unknown variables by leaving them as-is", () => {
			expect(engine.render("{{unknown}}", testData)).toBe("{{unknown}}");
		});

		it("processes conditional blocks (truthy)", () => {
			const template = "Title{{#if isRewatch}} (rewatch){{/if}}";
			const dataWithRewatch = { ...testData, isRewatch: true };
			expect(engine.render(template, dataWithRewatch)).toBe("Title (rewatch)");
		});

		it("processes conditional blocks (falsy)", () => {
			const template = "Title{{#if isRewatch}} (rewatch){{/if}}";
			expect(engine.render(template, testData)).toBe("Title");
		});

		it("handles multiple variables with different params", () => {
			const template = "{{title link=true}} - {{tags bullet=true}}";
			expect(engine.render(template, testData)).toBe(
				"[[The Revenant]] - - drama\n- survival"
			);
		});
	});

	describe("generateFilename", () => {
		it("generates filename from template", () => {
			expect(engine.generateFilename("{{year}} - {{title}}", testData)).toBe(
				"2015 - The Revenant"
			);
		});

		it("removes invalid filename characters", () => {
			const dataWithSpecialChars = { ...testData, title: 'Film: "Test"' };
			expect(engine.generateFilename("{{title}}", dataWithSpecialChars)).toBe("Film Test");
		});

		it("removes leading/trailing dots", () => {
			const dataWithDots = { ...testData, title: "...Hidden..." };
			expect(engine.generateFilename("{{title}}", dataWithDots)).toBe("Hidden");
		});

		it("trims whitespace", () => {
			const dataWithSpaces = { ...testData, title: "  Spaced  " };
			expect(engine.generateFilename("{{title}}", dataWithSpaces)).toBe("Spaced");
		});
	});

	describe("with special handlers", () => {
		interface MovieData {
			cast: Array<{ actor: string; character: string }>;
		}

		const movieData: MovieData = {
			cast: [
				{ actor: "Leonardo DiCaprio", character: "Hugh Glass" },
				{ actor: "Tom Hardy", character: "John Fitzgerald" },
			],
		};

		const engineWithHandlers = createTemplateEngine<MovieData>({
			accessors: {},
			specialHandlers: {
				castWithRoles: (data, params) => {
					const lines = data.cast.map((c) => {
						let actor = c.actor;
						let character = c.character;
						if (params.linkActors) actor = `[[${actor}]]`;
						if (params.linkCharacters) character = `[[${character}]]`;
						return `${actor} as ${character}`;
					});
					if (params.bullet) {
						return lines.map((l) => `- ${l}`).join("\n");
					}
					return lines.join(", ");
				},
			},
		});

		it("uses special handler for complex variables", () => {
			expect(engineWithHandlers.render("{{castWithRoles}}", movieData)).toBe(
				"Leonardo DiCaprio as Hugh Glass, Tom Hardy as John Fitzgerald"
			);
		});

		it("passes params to special handler", () => {
			expect(engineWithHandlers.render("{{castWithRoles bullet=true}}", movieData)).toBe(
				"- Leonardo DiCaprio as Hugh Glass\n- Tom Hardy as John Fitzgerald"
			);
		});

		it("handles linkActors param", () => {
			expect(engineWithHandlers.render("{{castWithRoles linkActors=true}}", movieData)).toBe(
				"[[Leonardo DiCaprio]] as Hugh Glass, [[Tom Hardy]] as John Fitzgerald"
			);
		});

		it("applies prefix/suffix to special handler output", () => {
			expect(
				engineWithHandlers.render('{{castWithRoles prefix="Cast: " suffix="."}}', movieData)
			).toBe("Cast: Leonardo DiCaprio as Hugh Glass, Tom Hardy as John Fitzgerald.");
		});
	});
});

// ============================================================================
// Console warnings
// ============================================================================

describe("yaml with bold/italic (incompatible options)", () => {
	it("ignores bold when yaml=true on arrays", () => {
		// bold/italic are silently ignored when yaml=true (incompatible)
		const result = formatArray(["A", "B"], { yaml: true, bold: true });
		expect(result).toBe('["A", "B"]'); // No bold applied, just YAML format
	});

	it("ignores bold when yaml=true on strings", () => {
		// bold/italic are silently ignored when yaml=true (incompatible)
		const result = formatValue("hello", { yaml: true, bold: true });
		expect(result).toBe('"hello"'); // No bold applied, just quoted
	});
});
