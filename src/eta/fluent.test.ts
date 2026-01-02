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
	rating,
	poster,
	backdrop,
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

		it("toNative returns the native string", () => {
			expect(str("hello").toNative()).toBe("hello");
			expect(typeof str("hello").toNative()).toBe("string");
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

		it("toNative returns copy of native array", () => {
			const result = arr(testArray).toNative();
			expect(result).toEqual(testArray);
			expect(Array.isArray(result)).toBe(true);
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

		it("yaml() creates inline array", () => {
			expect(arr(["A", "B"]).yaml()).toBe('["A", "B"]');
		});

		it("yaml() escapes quotes", () => {
			expect(arr(['Say "Hi"']).yaml()).toBe('["Say \\"Hi\\""]');
		});

		it("yamlMultiline() creates indented list", () => {
			expect(arr(["A", "B"]).yamlMultiline()).toBe("  - A\n  - B");
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

	it("toNative returns native number", () => {
		expect(num(42).toNative()).toBe(42);
		expect(typeof num(42).toNative()).toBe("number");
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

	it("toNative returns native boolean", () => {
		expect(bool(true).toNative()).toBe(true);
		expect(bool(false).toNative()).toBe(false);
		expect(typeof bool(true).toNative()).toBe("boolean");
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
// FluentRating
// ============================================================================

describe("FluentRating", () => {
	describe("basic operations", () => {
		it("toString returns string representation", () => {
			expect(rating(3.5).toString()).toBe("3.5");
			expect(rating(5).toString()).toBe("5");
		});

		it("toString returns empty string for null", () => {
			expect(rating(null).toString()).toBe("");
		});

		it("valueOf returns the value", () => {
			expect(rating(3.5).valueOf()).toBe(3.5);
			expect(rating(null).valueOf()).toBe(null);
		});

		it("toNative returns native value", () => {
			expect(rating(3.5).toNative()).toBe(3.5);
			expect(rating(null).toNative()).toBe(null);
		});

		it("isRated returns true when rated", () => {
			expect(rating(3.5).isRated()).toBe(true);
			expect(rating(0).isRated()).toBe(true); // 0 is a valid rating
			expect(rating(null).isRated()).toBe(false);
		});

		it("isUnrated returns true when null", () => {
			expect(rating(null).isUnrated()).toBe(true);
			expect(rating(3.5).isUnrated()).toBe(false);
		});
	});

	describe("over() scaling", () => {
		it("scales to base 10", () => {
			expect(rating(5).over(10).toNative()).toBe(10);
			expect(rating(3.5).over(10).toNative()).toBe(7);
			expect(rating(2.5).over(10).toNative()).toBe(5);
			expect(rating(1).over(10).toNative()).toBe(2);
		});

		it("scales to base 100", () => {
			expect(rating(5).over(100).toNative()).toBe(100);
			expect(rating(3.5).over(100).toNative()).toBe(70);
			expect(rating(2.5).over(100).toNative()).toBe(50);
		});

		it("scales to base 5 (identity)", () => {
			expect(rating(3.5).over(5).toNative()).toBe(3.5);
			expect(rating(5).over(5).toNative()).toBe(5);
		});

		it("returns 0 for unrated", () => {
			expect(rating(null).over(10).toNative()).toBe(0);
			expect(rating(null).over(100).toNative()).toBe(0);
		});

		it("returns FluentNumber for chaining", () => {
			const result = rating(3.5).over(10);
			expect(result).toBeInstanceOf(FluentNumber);
			expect(result.times(2).toNative()).toBe(14);
		});
	});

	describe("stars() formatting", () => {
		it("converts whole ratings to stars", () => {
			expect(rating(5).stars().toString()).toBe("★★★★★");
			expect(rating(4).stars().toString()).toBe("★★★★");
			expect(rating(3).stars().toString()).toBe("★★★");
			expect(rating(2).stars().toString()).toBe("★★");
			expect(rating(1).stars().toString()).toBe("★");
		});

		it("converts half ratings to stars with half symbol", () => {
			expect(rating(4.5).stars().toString()).toBe("★★★★½");
			expect(rating(3.5).stars().toString()).toBe("★★★½");
			expect(rating(2.5).stars().toString()).toBe("★★½");
			expect(rating(1.5).stars().toString()).toBe("★½");
			expect(rating(0.5).stars().toString()).toBe("½");
		});

		it("returns empty string for unrated", () => {
			expect(rating(null).stars().toString()).toBe("");
		});

		it("returns FluentString for chaining", () => {
			const result = rating(3.5).stars();
			expect(result).toBeInstanceOf(FluentString);
			expect(result.bold().toString()).toBe("**★★★½**");
		});
	});
});

// ============================================================================
// FluentImage
// ============================================================================

describe("FluentImage", () => {
	const testPath = "/abc123.jpg";

	describe("poster", () => {
		it("isEmpty returns true for empty path", () => {
			expect(poster("").isEmpty()).toBe(true);
			expect(poster(testPath).isEmpty()).toBe(false);
		});

		it("toNative returns raw path", () => {
			expect(poster(testPath).toNative()).toBe(testPath);
		});

		it("toString returns URL at default size (L/w500)", () => {
			expect(poster(testPath).toString()).toBe("https://image.tmdb.org/t/p/w500/abc123.jpg");
		});

		it("toString returns empty for empty path", () => {
			expect(poster("").toString()).toBe("");
		});

		describe("size() with named sizes", () => {
			it("XXS returns w92", () => {
				expect(poster(testPath).size("XXS").toString()).toBe(
					"https://image.tmdb.org/t/p/w92/abc123.jpg"
				);
			});

			it("XS returns w154", () => {
				expect(poster(testPath).size("XS").toString()).toBe(
					"https://image.tmdb.org/t/p/w154/abc123.jpg"
				);
			});

			it("S returns w185", () => {
				expect(poster(testPath).size("S").toString()).toBe(
					"https://image.tmdb.org/t/p/w185/abc123.jpg"
				);
			});

			it("M returns w342", () => {
				expect(poster(testPath).size("M").toString()).toBe(
					"https://image.tmdb.org/t/p/w342/abc123.jpg"
				);
			});

			it("L returns w500", () => {
				expect(poster(testPath).size("L").toString()).toBe(
					"https://image.tmdb.org/t/p/w500/abc123.jpg"
				);
			});

			it("XL returns w780", () => {
				expect(poster(testPath).size("XL").toString()).toBe(
					"https://image.tmdb.org/t/p/w780/abc123.jpg"
				);
			});

			it("OG returns original", () => {
				expect(poster(testPath).size("OG").toString()).toBe(
					"https://image.tmdb.org/t/p/original/abc123.jpg"
				);
			});

			it("is case-insensitive", () => {
				expect(poster(testPath).size("l").toString()).toBe(
					"https://image.tmdb.org/t/p/w500/abc123.jpg"
				);
				expect(poster(testPath).size("og").toString()).toBe(
					"https://image.tmdb.org/t/p/original/abc123.jpg"
				);
			});
		});

		describe("size() with pixel values", () => {
			it("92 returns w92", () => {
				expect(poster(testPath).size(92).toString()).toBe(
					"https://image.tmdb.org/t/p/w92/abc123.jpg"
				);
			});

			it("500 returns w500", () => {
				expect(poster(testPath).size(500).toString()).toBe(
					"https://image.tmdb.org/t/p/w500/abc123.jpg"
				);
			});

			it("780 returns w780", () => {
				expect(poster(testPath).size(780).toString()).toBe(
					"https://image.tmdb.org/t/p/w780/abc123.jpg"
				);
			});

			it("unknown size falls back to default", () => {
				expect(poster(testPath).size(999).toString()).toBe(
					"https://image.tmdb.org/t/p/w500/abc123.jpg"
				);
			});
		});

		it("size() returns empty string for empty path", () => {
			expect(poster("").size("L").toString()).toBe("");
		});

		it("size() returns FluentString for chaining", () => {
			const result = poster(testPath).size("L");
			expect(result).toBeInstanceOf(FluentString);
		});

		it("url() returns FluentString at default size", () => {
			const result = poster(testPath).url();
			expect(result).toBeInstanceOf(FluentString);
			expect(result.toString()).toBe("https://image.tmdb.org/t/p/w500/abc123.jpg");
		});
	});

	describe("backdrop", () => {
		it("toString returns URL at default size (L/w1280)", () => {
			expect(backdrop(testPath).toString()).toBe(
				"https://image.tmdb.org/t/p/w1280/abc123.jpg"
			);
		});

		describe("size() with named sizes", () => {
			it("S returns w300", () => {
				expect(backdrop(testPath).size("S").toString()).toBe(
					"https://image.tmdb.org/t/p/w300/abc123.jpg"
				);
			});

			it("M returns w780", () => {
				expect(backdrop(testPath).size("M").toString()).toBe(
					"https://image.tmdb.org/t/p/w780/abc123.jpg"
				);
			});

			it("L returns w1280", () => {
				expect(backdrop(testPath).size("L").toString()).toBe(
					"https://image.tmdb.org/t/p/w1280/abc123.jpg"
				);
			});

			it("OG returns original", () => {
				expect(backdrop(testPath).size("OG").toString()).toBe(
					"https://image.tmdb.org/t/p/original/abc123.jpg"
				);
			});
		});

		describe("size() with pixel values", () => {
			it("300 returns w300", () => {
				expect(backdrop(testPath).size(300).toString()).toBe(
					"https://image.tmdb.org/t/p/w300/abc123.jpg"
				);
			});

			it("1280 returns w1280", () => {
				expect(backdrop(testPath).size(1280).toString()).toBe(
					"https://image.tmdb.org/t/p/w1280/abc123.jpg"
				);
			});
		});
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
