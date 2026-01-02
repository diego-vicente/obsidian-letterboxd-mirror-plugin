import { describe, it, expect } from "vitest";
import { renderTemplate, generateFilename, wrapData, str, arr, num, bool } from "./engine";

// ============================================================================
// renderTemplate
// ============================================================================

describe("renderTemplate", () => {
	describe("with raw data", () => {
		it("renders simple interpolation", () => {
			const result = renderTemplate("<%= it.name %>", { name: "Test" });
			expect(result).toBe("Test");
		});

		it("renders multiple interpolations", () => {
			const result = renderTemplate("<%= it.title %> (<%= it.year %>)", {
				title: "The Revenant",
				year: 2015,
			});
			expect(result).toBe("The Revenant (2015)");
		});

		it("renders conditionals", () => {
			const template = "<% if (it.show) { %>visible<% } %>";
			expect(renderTemplate(template, { show: true })).toBe("visible");
			expect(renderTemplate(template, { show: false })).toBe("");
		});

		it("renders loops", () => {
			const template = "<% it.items.forEach(item => { %><%= item %> <% }) %>";
			expect(renderTemplate(template, { items: ["a", "b", "c"] })).toBe("a b c ");
		});
	});

	describe("with fluent wrappers", () => {
		it("renders FluentString", () => {
			const result = renderTemplate("<%= it.title %>", { title: str("Test") });
			expect(result).toBe("Test");
		});

		it("renders FluentString with formatting", () => {
			const result = renderTemplate("<%= it.title.bold() %>", { title: str("Test") });
			expect(result).toBe("**Test**");
		});

		it("renders FluentString with link", () => {
			const result = renderTemplate("<%= it.title.link() %>", { title: str("Film") });
			expect(result).toBe("[[Film]]");
		});

		it("renders FluentArray", () => {
			const result = renderTemplate("<%= it.tags %>", { tags: arr(["drama", "action"]) });
			expect(result).toBe("drama, action");
		});

		it("renders FluentArray with top", () => {
			const result = renderTemplate("<%= it.items.top(2) %>", {
				items: arr(["a", "b", "c", "d"]),
			});
			expect(result).toBe("a, b");
		});

		it("renders FluentArray with chained methods", () => {
			const result = renderTemplate("<%= it.cast.top(2).link().bullet() %>", {
				cast: arr(["Actor A", "Actor B", "Actor C"]),
			});
			expect(result).toBe("- [[Actor A]]\n- [[Actor B]]");
		});

		it("renders FluentNumber", () => {
			const result = renderTemplate("<%= it.rating %>", { rating: num(8.5) });
			expect(result).toBe("8.5");
		});

		it("renders FluentNumber with times", () => {
			const result = renderTemplate("<%= it.rating.times(2) %>", { rating: num(4) });
			expect(result).toBe("8");
		});

		it("renders FluentBoolean", () => {
			const result = renderTemplate("<%= it.active %>", { active: bool(true) });
			expect(result).toBe("true");
		});

		it("renders FluentBoolean with ifElse", () => {
			const result = renderTemplate("<%= it.rewatch.ifElse('Rewatch', 'First watch') %>", {
				rewatch: bool(true),
			});
			expect(result).toBe("Rewatch");
		});
	});

	describe("with wrapData helper", () => {
		it("wraps and renders object data", () => {
			const rawData = {
				title: "The Revenant",
				year: 2015,
				tags: ["drama", "survival"],
				rewatch: false,
			};
			const data = wrapData(rawData);

			expect(renderTemplate("<%= it.title %>", data)).toBe("The Revenant");
			expect(renderTemplate("<%= it.year %>", data)).toBe("2015");
			expect(renderTemplate("<%= it.tags %>", data)).toBe("drama, survival");
			expect(renderTemplate("<%= it.rewatch %>", data)).toBe("false");
		});

		it("allows chaining after wrapData", () => {
			const data = wrapData({
				cast: ["Actor A", "Actor B", "Actor C"],
			});

			expect(renderTemplate("<%= it.cast.top(2).link() %>", data)).toBe(
				"[[Actor A]], [[Actor B]]"
			);
		});

		it("handles null values as empty string", () => {
			const data = wrapData({
				review: null as unknown as string,
			});

			expect(renderTemplate("<%= it.review %>", data)).toBe("");
		});
	});

	describe("helper functions via functionHeader", () => {
		it("str helper is available in templates", () => {
			const result = renderTemplate("<%= str('hello').bold() %>", {});
			expect(result).toBe("**hello**");
		});

		it("arr helper is available in templates", () => {
			const result = renderTemplate("<%= arr(['a', 'b']).link().bullet() %>", {});
			expect(result).toBe("- [[a]]\n- [[b]]");
		});

		it("num helper is available in templates", () => {
			const result = renderTemplate("<%= num(5).times(2) %>", {});
			expect(result).toBe("10");
		});

		it("bool helper is available in templates", () => {
			const result = renderTemplate("<%= bool(true).ifElse('yes', 'no') %>", {});
			expect(result).toBe("yes");
		});
	});

	describe("complex templates", () => {
		it("renders movie template", () => {
			const data = wrapData({
				title: "The Revenant",
				year: 2015,
				rating: 8.5,
				genres: ["Drama", "Adventure", "Western"],
				rewatch: true,
			});

			const template = `# <%= it.title %> (<%= it.year %>)

Rating: <%= it.rating %>/10
Genres: <%= it.genres.link() %>

<% if (it.rewatch.isTrue()) { %>This is a rewatch!<% } %>
`;

			const result = renderTemplate(template, data);
			expect(result).toContain("# The Revenant (2015)");
			expect(result).toContain("Rating: 8.5/10");
			expect(result).toContain("Genres: [[Drama]], [[Adventure]], [[Western]]");
			expect(result).toContain("This is a rewatch!");
		});

		it("renders YAML frontmatter", () => {
			const data = wrapData({
				title: "Test Film",
				tags: ["drama", "action"],
			});

			const template = `---
title: <%= it.title.yaml() %>
tags: <%= it.tags.yaml() %>
---`;

			const result = renderTemplate(template, data);
			expect(result).toBe(`---
title: "Test Film"
tags: ["drama", "action"]
---`);
		});
	});
});

// ============================================================================
// generateFilename
// ============================================================================

describe("generateFilename", () => {
	it("generates filename from template", () => {
		const data = wrapData({ title: "The Revenant", year: 2015 });
		expect(generateFilename("<%= it.year %> - <%= it.title %>", data)).toBe(
			"2015 - The Revenant"
		);
	});

	it("removes invalid filename characters", () => {
		const data = wrapData({ title: 'Film: "Test"' });
		expect(generateFilename("<%= it.title %>", data)).toBe("Film Test");
	});

	it("removes leading/trailing dots", () => {
		const data = wrapData({ title: "...Hidden..." });
		expect(generateFilename("<%= it.title %>", data)).toBe("Hidden");
	});

	it("trims whitespace", () => {
		const data = wrapData({ title: "  Spaced  " });
		expect(generateFilename("<%= it.title %>", data)).toBe("Spaced");
	});

	it("handles complex templates", () => {
		const data = wrapData({ title: "Test", year: 2024, rewatch: true });
		const template =
			"<%= it.title %> (<%= it.year %>)<%= it.rewatch.ifElse(' - Rewatch', '') %>";
		expect(generateFilename(template, data)).toBe("Test (2024) - Rewatch");
	});
});

// ============================================================================
// wrapData
// ============================================================================

describe("wrapData", () => {
	it("wraps string properties as FluentString", () => {
		const data = wrapData({ name: "test" });
		expect(data.name.bold().toString()).toBe("**test**");
	});

	it("wraps array properties as FluentArray", () => {
		const data = wrapData({ items: ["a", "b"] });
		expect(data.items.link().toString()).toBe("[[a]], [[b]]");
	});

	it("wraps number properties as FluentNumber", () => {
		const data = wrapData({ count: 5 });
		expect(data.count.times(2).toString()).toBe("10");
	});

	it("wraps boolean properties as FluentBoolean", () => {
		const data = wrapData({ active: true });
		expect(data.active.ifElse("yes", "no")).toBe("yes");
	});

	it("wraps null as empty FluentString", () => {
		const data = wrapData({ value: null as unknown as string });
		expect(data.value.toString()).toBe("");
	});

	it("wraps undefined as empty FluentString", () => {
		const data = wrapData({ value: undefined as unknown as string });
		expect(data.value.toString()).toBe("");
	});
});
