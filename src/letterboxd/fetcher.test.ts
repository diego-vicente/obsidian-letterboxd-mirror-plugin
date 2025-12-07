import { describe, it, expect } from "vitest";
import {
	extractViewingIdFromHtml,
	extractFilmSlug,
	extractTmdbId,
	extractViewingIdFromRssGuid,
} from "./fetcher";

// ============================================================================
// extractViewingIdFromHtml
// ============================================================================

describe("extractViewingIdFromHtml", () => {
	it("extracts viewing ID from data-object-id attribute", () => {
		const html = `<section class="poster-list" data-object-id="viewing:1093163294" data-owner="user">`;
		expect(extractViewingIdFromHtml(html)).toBe("1093163294");
	});

	it("returns null when no viewing ID found", () => {
		const html = `<section class="poster-list" data-owner="user">`;
		expect(extractViewingIdFromHtml(html)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(extractViewingIdFromHtml("")).toBeNull();
	});

	it("extracts from complex HTML with multiple attributes", () => {
		const html = `
			<div class="other" data-something="else"></div>
			<section class="poster-list -p150 el col viewing-poster-container" 
				data-owner="vicente35mm" 
				data-object-id="viewing:1093163294" 
				data-object-name="review">
			</section>
		`;
		expect(extractViewingIdFromHtml(html)).toBe("1093163294");
	});

	it("returns first match when multiple exist", () => {
		const html = `
			<div data-object-id="viewing:111"></div>
			<div data-object-id="viewing:222"></div>
		`;
		expect(extractViewingIdFromHtml(html)).toBe("111");
	});

	it("handles different numeric IDs", () => {
		expect(extractViewingIdFromHtml('data-object-id="viewing:1"')).toBe("1");
		expect(extractViewingIdFromHtml('data-object-id="viewing:999999999"')).toBe("999999999");
	});
});

// ============================================================================
// extractFilmSlug
// ============================================================================

describe("extractFilmSlug", () => {
	it("extracts film slug from data-item-slug attribute", () => {
		const html = `<div data-item-slug="the-revenant-2015" data-item-link="/film/the-revenant-2015/">`;
		expect(extractFilmSlug(html)).toBe("the-revenant-2015");
	});

	it("returns null when no film slug found", () => {
		const html = `<div data-item-link="/film/something/">`;
		expect(extractFilmSlug(html)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(extractFilmSlug("")).toBeNull();
	});

	it("handles slugs with multiple hyphens", () => {
		const html = `<div data-item-slug="la-la-land-2016">`;
		expect(extractFilmSlug(html)).toBe("la-la-land-2016");
	});

	it("handles slugs with numbers", () => {
		const html = `<div data-item-slug="2001-a-space-odyssey">`;
		expect(extractFilmSlug(html)).toBe("2001-a-space-odyssey");
	});

	it("extracts from complex HTML", () => {
		const html = `
			<div class="react-component" 
				data-component-class="LazyPoster"
				data-item-name="The Revenant (2015)" 
				data-item-slug="the-revenant-2015" 
				data-item-link="/film/the-revenant-2015/"
				data-film-id="207224">
			</div>
		`;
		expect(extractFilmSlug(html)).toBe("the-revenant-2015");
	});
});

// ============================================================================
// extractTmdbId
// ============================================================================

describe("extractTmdbId", () => {
	it("extracts TMDB ID from data-tmdb-id attribute", () => {
		const html = `<body data-tmdb-type="movie" data-tmdb-id="281957">`;
		expect(extractTmdbId(html)).toBe("281957");
	});

	it("returns null when no TMDB ID found", () => {
		const html = `<body data-tmdb-type="movie">`;
		expect(extractTmdbId(html)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(extractTmdbId("")).toBeNull();
	});

	it("handles different numeric IDs", () => {
		expect(extractTmdbId('data-tmdb-id="1"')).toBe("1");
		expect(extractTmdbId('data-tmdb-id="999999"')).toBe("999999");
	});

	it("extracts from complex HTML", () => {
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Film</title></head>
			<body class="film-page" data-tmdb-type="movie" data-tmdb-id="281957">
				<div class="content">...</div>
			</body>
			</html>
		`;
		expect(extractTmdbId(html)).toBe("281957");
	});
});

// ============================================================================
// extractViewingIdFromRssGuid
// ============================================================================

describe("extractViewingIdFromRssGuid", () => {
	it("extracts ID from letterboxd-review-{id} format", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-review-1093163294")).toBe(
			"1093163294"
		);
	});

	it("extracts ID from letterboxd-watch-{id} format", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-watch-456789")).toBe(
			"456789"
		);
	});

	it("returns null for unrecognized format", () => {
		expect(extractViewingIdFromRssGuid("some-other-guid")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(extractViewingIdFromRssGuid("")).toBeNull();
	});

	it("returns null for partial match", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-review-")).toBeNull();
	});

	it("returns null for non-numeric ID", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-review-abc")).toBeNull();
	});

	it("returns null for similar but incorrect formats", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-comment-123")).toBeNull();
		expect(extractViewingIdFromRssGuid("letterboxd_review_123")).toBeNull();
		expect(extractViewingIdFromRssGuid("review-123")).toBeNull();
	});

	it("handles large IDs", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-review-9999999999999")).toBe(
			"9999999999999"
		);
	});
});
