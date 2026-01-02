import { describe, it, expect } from "vitest";
import {
	FluentString,
	FluentArray,
	FluentNumber,
	FluentBoolean,
	str,
	arr,
	num,
	bool,
	wrap,
} from "./fluent";

// ============================================================================
// FluentString
// ============================================================================

describe("FluentString", () => {
	describe("basic operations", () => {
		it("toString returns the value", () => {
			expect(str("hello").toString()).toBe("hello");
		});

		it("valueOf returns the value", () => {
			expect(str("hello").valueOf()).toBe("hello");
		});

		it("isEmpty returns true for empty string", () => {
			expect(str("").isEmpty()).toBe(true);
			expect(str("hello").isEmpty()).toBe(false);
		});
	});

	describe("formatting", () => {
		it("link wraps in wiki-link brackets", () => {
			expect(str("Test").link().toString()).toBe("[[Test]]");
		});

		it("bold wraps in double asterisks", () => {
			expect(str("Test").bold().toString()).toBe("**Test**");
		});

		it("italic wraps in single asterisks", () => {
			expect(str("Test").italic().toString()).toBe("*Test*");
		});

		it("yaml wraps in quotes and escapes", () => {
			expect(str("hello").yaml().toString()).toBe('"hello"');
			expect(str('say "hi"').yaml().toString()).toBe('"say \\"hi\\""');
		});

		it("quote prefixes each line with >", () => {
			expect(str("line1").quote().toString()).toBe("> line1");
			expect(str("line1\nline2").quote().toString()).toBe("> line1\n> line2");
		});

		it("prefix adds text before", () => {
			expect(str("world").prefix("hello ").toString()).toBe("hello world");
		});

		it("suffix adds text after", () => {
			expect(str("hello").suffix("!").toString()).toBe("hello!");
		});
	});

	describe("chaining", () => {
		it("supports method chaining", () => {
			expect(str("Test").bold().italic().toString()).toBe("***Test***");
		});

		it("link then bold", () => {
			expect(str("Film").link().bold().toString()).toBe("**[[Film]]**");
		});
	});

	describe("skipEmpty", () => {
		it("returns empty string for empty value", () => {
			expect(str("").skipEmpty().toString()).toBe("");
		});

		it("returns value for non-empty", () => {
			expect(str("hello").skipEmpty().toString()).toBe("hello");
		});

		it("applies wrapper function for non-empty", () => {
			expect(
				str("hello")
					.skipEmpty((s) => s.bold())
					.toString()
			).toBe("**hello**");
			expect(
				str("")
					.skipEmpty((s) => s.bold())
					.toString()
			).toBe("");
		});
	});
});

// ============================================================================
// FluentArray
// ============================================================================

describe("FluentArray", () => {
	const testArray = ["Apple", "Banana", "Cherry", "Date"];

	describe("basic operations", () => {
		it("toString returns comma-separated", () => {
			expect(arr(testArray).toString()).toBe("Apple, Banana, Cherry, Date");
		});

		it("toArray returns copy of array", () => {
			expect(arr(testArray).toArray()).toEqual(testArray);
		});

		it("length returns count", () => {
			expect(arr(testArray).length).toBe(4);
		});

		it("isEmpty returns true for empty array", () => {
			expect(arr([]).isEmpty()).toBe(true);
			expect(arr(testArray).isEmpty()).toBe(false);
		});
	});

	describe("transformations", () => {
		it("top takes first n items", () => {
			expect(arr(testArray).top(2).toString()).toBe("Apple, Banana");
		});

		it("link wraps each item", () => {
			expect(arr(["A", "B"]).link().toString()).toBe("[[A]], [[B]]");
		});

		it("bold wraps each item", () => {
			expect(arr(["A", "B"]).bold().toString()).toBe("**A**, **B**");
		});

		it("italic wraps each item", () => {
			expect(arr(["A", "B"]).italic().toString()).toBe("*A*, *B*");
		});

		it("map applies custom function", () => {
			expect(
				arr(["a", "b"])
					.map((s) => s.toUpperCase())
					.toString()
			).toBe("A, B");
		});

		it("filter removes items", () => {
			expect(
				arr(["a", "bb", "ccc"])
					.filter((s) => s.length > 1)
					.toString()
			).toBe("bb, ccc");
		});
	});

	describe("terminal operations", () => {
		it("join with custom separator", () => {
			expect(arr(["A", "B", "C"]).join(" | ")).toBe("A | B | C");
		});

		it("bullet creates markdown list", () => {
			expect(arr(["A", "B"]).bullet()).toBe("- A\n- B");
		});

		it("yaml creates inline array", () => {
			expect(arr(["A", "B"]).yaml()).toBe('["A", "B"]');
		});

		it("yaml escapes quotes", () => {
			expect(arr(['Say "Hi"']).yaml()).toBe('["Say \\"Hi\\""]');
		});

		it("yamlBullet creates indented list", () => {
			expect(arr(["A", "B"]).yamlBullet()).toBe("  - A\n  - B");
		});
	});

	describe("chaining", () => {
		it("top then link", () => {
			expect(arr(testArray).top(2).link().toString()).toBe("[[Apple]], [[Banana]]");
		});

		it("link then bullet", () => {
			expect(arr(["A", "B"]).link().bullet()).toBe("- [[A]]\n- [[B]]");
		});

		it("top then link then bullet", () => {
			expect(arr(testArray).top(2).link().bullet()).toBe("- [[Apple]]\n- [[Banana]]");
		});

		it("top then bold then bullet", () => {
			expect(arr(testArray).top(2).bold().bullet()).toBe("- **Apple**\n- **Banana**");
		});
	});
});

// ============================================================================
// FluentNumber
// ============================================================================

describe("FluentNumber", () => {
	it("toString returns string representation", () => {
		expect(num(42).toString()).toBe("42");
		expect(num(3.5).toString()).toBe("3.5");
	});

	it("valueOf returns number", () => {
		expect(num(42).valueOf()).toBe(42);
	});

	it("isZero checks for zero", () => {
		expect(num(0).isZero()).toBe(true);
		expect(num(1).isZero()).toBe(false);
	});

	it("times multiplies", () => {
		expect(num(5).times(2).valueOf()).toBe(10);
	});

	it("prefix adds text before", () => {
		expect(num(5).prefix("Rating: ").toString()).toBe("Rating: 5");
	});

	it("suffix adds text after", () => {
		expect(num(5).suffix("/10").toString()).toBe("5/10");
	});

	it("fixed formats decimals", () => {
		expect(num(3.14159).fixed(2).toString()).toBe("3.14");
	});
});

// ============================================================================
// FluentBoolean
// ============================================================================

describe("FluentBoolean", () => {
	it("toString returns string representation", () => {
		expect(bool(true).toString()).toBe("true");
		expect(bool(false).toString()).toBe("false");
	});

	it("valueOf returns boolean", () => {
		expect(bool(true).valueOf()).toBe(true);
		expect(bool(false).valueOf()).toBe(false);
	});

	it("isTrue checks for true", () => {
		expect(bool(true).isTrue()).toBe(true);
		expect(bool(false).isTrue()).toBe(false);
	});

	it("isFalse checks for false", () => {
		expect(bool(false).isFalse()).toBe(true);
		expect(bool(true).isFalse()).toBe(false);
	});

	it("ifElse returns appropriate value", () => {
		expect(bool(true).ifElse("yes", "no")).toBe("yes");
		expect(bool(false).ifElse("yes", "no")).toBe("no");
	});
});

// ============================================================================
// wrap utility
// ============================================================================

describe("wrap", () => {
	it("wraps string as FluentString", () => {
		const result = wrap("hello");
		expect(result).toBeInstanceOf(FluentString);
		expect(result.toString()).toBe("hello");
	});

	it("wraps array as FluentArray", () => {
		const result = wrap(["a", "b"]);
		expect(result).toBeInstanceOf(FluentArray);
		expect(result.toString()).toBe("a, b");
	});

	it("wraps number as FluentNumber", () => {
		const result = wrap(42);
		expect(result).toBeInstanceOf(FluentNumber);
		expect(result.toString()).toBe("42");
	});

	it("wraps boolean as FluentBoolean", () => {
		const result = wrap(true);
		expect(result).toBeInstanceOf(FluentBoolean);
		expect(result.toString()).toBe("true");
	});
});
