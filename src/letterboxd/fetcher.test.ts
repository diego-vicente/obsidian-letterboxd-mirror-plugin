import { describe, it, expect } from "vitest";
import {
	extractViewingIdFromHtml,
	extractTmdbId,
	extractViewingIdFromRssGuid,
	extractTagsFromHtml,
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
		expect(extractViewingIdFromRssGuid("letterboxd-review-1093163294")).toBe("1093163294");
	});

	it("extracts ID from letterboxd-watch-{id} format", () => {
		expect(extractViewingIdFromRssGuid("letterboxd-watch-456789")).toBe("456789");
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

// ============================================================================
// extractTagsFromHtml
// ============================================================================

describe("extractTagsFromHtml", () => {
	it("extracts single tag from tags list", () => {
		const html = `
			<ul class="tags">
				<li>
					<a href="/e2e_test_acc/tag/at-home/films/">at home</a>
				</li>
			</ul>
		`;
		expect(extractTagsFromHtml(html)).toEqual(["at home"]);
	});

	it("extracts multiple tags from tags list", () => {
		const html = `
			<ul class="tags">
				<li><a href="/user/tag/cinema/films/">cinema</a></li>
				<li><a href="/user/tag/date-night/films/">date night</a></li>
				<li><a href="/user/tag/imax/films/">imax</a></li>
			</ul>
		`;
		expect(extractTagsFromHtml(html)).toEqual(["cinema", "date night", "imax"]);
	});

	it("returns empty array when no tags ul found", () => {
		const html = `<div class="content">No tags here</div>`;
		expect(extractTagsFromHtml(html)).toEqual([]);
	});

	it("returns empty array for empty tags list", () => {
		const html = `<ul class="tags"></ul>`;
		expect(extractTagsFromHtml(html)).toEqual([]);
	});

	it("returns empty array for empty string", () => {
		expect(extractTagsFromHtml("")).toEqual([]);
	});

	it("handles tags with special characters", () => {
		const html = `
			<ul class="tags">
				<li><a href="/user/tag/4k-uhd/films/">4k uhd</a></li>
				<li><a href="/user/tag/re-watch/films/">re-watch</a></li>
			</ul>
		`;
		expect(extractTagsFromHtml(html)).toEqual(["4k uhd", "re-watch"]);
	});

	it("trims whitespace from tag text", () => {
		const html = `
			<ul class="tags">
				<li>
					<a href="/user/tag/spaced/films/">  spaced tag  </a>
				</li>
			</ul>
		`;
		expect(extractTagsFromHtml(html)).toEqual(["spaced tag"]);
	});

	it("extracts tags from real Letterboxd HTML structure", () => {
		const html = `
			<!-- Hide tags on redacted reviews, except for moderators -->
			<ul class="tags">
				<li>
					<a href="/e2e_test_acc/tag/at-home/films/">at home</a>
				</li>
			</ul>
			<script>/* some script */</script>
		`;
		expect(extractTagsFromHtml(html)).toEqual(["at home"]);
	});

	it("ignores non-tag links inside tags ul", () => {
		// This shouldn't happen in practice, but test defensive behavior
		const html = `
			<ul class="tags">
				<li><a href="/user/tag/cinema/films/">cinema</a></li>
				<li><a href="/film/something/">not a tag</a></li>
			</ul>
		`;
		// Only matches links with /tag/ in the path
		expect(extractTagsFromHtml(html)).toEqual(["cinema"]);
	});
});
