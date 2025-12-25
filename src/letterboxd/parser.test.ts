import { describe, it, expect } from "vitest";
import { ratingToStars, extractPosterUrl, extractReviewText } from "./parser";
import { extractViewingIdFromRssGuid } from "./fetcher";

// ============================================================================
// ratingToStars
// ============================================================================

describe("ratingToStars", () => {
	it("returns empty string for null", () => {
		expect(ratingToStars(null)).toBe("");
	});

	it("returns 1 star for 1", () => {
		expect(ratingToStars(1)).toBe("★");
	});

	it("returns 2 stars for 2", () => {
		expect(ratingToStars(2)).toBe("★★");
	});

	it("returns 3 stars for 3", () => {
		expect(ratingToStars(3)).toBe("★★★");
	});

	it("returns 4 stars for 4", () => {
		expect(ratingToStars(4)).toBe("★★★★");
	});

	it("returns 5 stars for 5", () => {
		expect(ratingToStars(5)).toBe("★★★★★");
	});

	it("returns half star for 0.5", () => {
		expect(ratingToStars(0.5)).toBe("½");
	});

	it("returns 1.5 stars correctly", () => {
		expect(ratingToStars(1.5)).toBe("★½");
	});

	it("returns 3.5 stars correctly", () => {
		expect(ratingToStars(3.5)).toBe("★★★½");
	});

	it("returns 4.5 stars correctly", () => {
		expect(ratingToStars(4.5)).toBe("★★★★½");
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
});

// ============================================================================
// extractPosterUrl
// ============================================================================

describe("extractPosterUrl", () => {
	it("extracts poster URL from img tag", () => {
		const html = '<p><img src="https://example.com/poster.jpg"/></p><p>Review text</p>';
		expect(extractPosterUrl(html)).toBe("https://example.com/poster.jpg");
	});

	it("returns empty string when no img tag", () => {
		const html = "<p>Just some text</p>";
		expect(extractPosterUrl(html)).toBe("");
	});

	it("handles complex img tag with multiple attributes", () => {
		const html = '<p><img src="https://example.com/poster.jpg" alt="Poster" width="150"/></p>';
		expect(extractPosterUrl(html)).toBe("https://example.com/poster.jpg");
	});

	it("returns empty string for empty input", () => {
		expect(extractPosterUrl("")).toBe("");
	});
});

// ============================================================================
// extractReviewText
// ============================================================================

describe("extractReviewText", () => {
	it("extracts plain text from HTML", () => {
		const html = "<p>This is a review.</p>";
		expect(extractReviewText(html)).toBe("This is a review.");
	});

	it("removes img tag", () => {
		const html = '<p><img src="https://example.com/poster.jpg"/></p><p>Review text</p>';
		expect(extractReviewText(html)).toBe("Review text");
	});

	it("removes spoiler warning", () => {
		const html = "<p><em>This review may contain spoilers.</em></p><p>Actual review</p>";
		expect(extractReviewText(html)).toBe("Actual review");
	});

	it('removes "Watched on..." paragraph', () => {
		const html = "<p>Watched on Thursday 5 December 2025</p>";
		expect(extractReviewText(html)).toBe("");
	});

	it("converts paragraph breaks to newlines", () => {
		const html = "<p>First paragraph.</p><p>Second paragraph.</p>";
		expect(extractReviewText(html)).toBe("First paragraph.\n\nSecond paragraph.");
	});

	it("converts br tags to newlines", () => {
		const html = "<p>Line 1<br/>Line 2</p>";
		expect(extractReviewText(html)).toBe("Line 1\nLine 2");
	});

	it("decodes HTML entities", () => {
		const html = "<p>Tom &amp; Jerry said &quot;hello&quot;</p>";
		expect(extractReviewText(html)).toBe('Tom & Jerry said "hello"');
	});

	it("strips remaining HTML tags", () => {
		const html = "<p>This is <em>emphasized</em> and <strong>bold</strong></p>";
		expect(extractReviewText(html)).toBe("This is emphasized and bold");
	});

	it("handles complex real-world review", () => {
		const html = `<p><img src="https://a.ltrbxd.com/poster.jpg"/></p>
<p><em>This review may contain spoilers.</em></p>
<p>Great film! I loved the <em>cinematography</em>.</p>
<p>Would watch again.</p>`;
		expect(extractReviewText(html)).toBe(
			"Great film! I loved the cinematography.\n\nWould watch again."
		);
	});

	it("returns empty string for empty input", () => {
		expect(extractReviewText("")).toBe("");
	});

	it("trims whitespace", () => {
		const html = "<p>  Padded text  </p>";
		expect(extractReviewText(html)).toBe("Padded text");
	});
});
