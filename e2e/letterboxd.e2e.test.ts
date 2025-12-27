/**
 * Letterboxd E2E Tests
 *
 * These tests make real HTTP requests to Letterboxd and TMDB APIs
 * using the e2e_test_acc test account.
 *
 * Run with: npm run test:e2e
 *
 * The obsidian module is mocked via vitest alias in vitest.e2e.config.ts
 * to use real HTTP requests instead of Obsidian's requestUrl.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
	TEST_USERNAME,
	EXPECTED_ENTRIES,
	readFixtureCSV,
	getTMDBApiKey,
	hasTMDBApiKey,
	fetchUrl,
} from "./setup";
import {
	MockPlugin,
	createTempVault,
	cleanupTempVault,
	readNoteFromVault,
	listNotesInVault,
} from "./mock-vault";
import { fetchLetterboxdRSS } from "../src/letterboxd/parser";
import {
	fetchLetterboxdPageData,
	extractViewingIdFromHtml,
	extractTmdbId,
} from "../src/letterboxd/fetcher";
import { parseLetterboxdExport } from "../src/letterboxd/csv-parser";
import { fetchTMDBMovie } from "../src/tmdb/api";
import { syncDiary, importFromCSV } from "../src/notes/sync";
import { syncFilmsFromTMDB } from "../src/tmdb/sync";
import type LetterboxdPlugin from "../src/main";

// ============================================================================
// E2E 6: Letterboxd Page Fetcher
// ============================================================================

describe("E2E 6: Letterboxd Page Fetcher", () => {
	it("extracts viewing ID from Die Hard diary page", async () => {
		const { letterboxdUri, viewingId, tmdbId } = EXPECTED_ENTRIES.dieHard;

		const result = await fetchLetterboxdPageData(letterboxdUri);

		expect(result).not.toBeNull();
		expect(result!.viewingId).toBe(viewingId);
		expect(result!.tmdbId).toBe(tmdbId);
	});

	it("extracts viewing ID from One Battle After Another diary page", async () => {
		const { letterboxdUri, viewingId, tmdbId } = EXPECTED_ENTRIES.oneBattleAfterAnother;

		const result = await fetchLetterboxdPageData(letterboxdUri);

		expect(result).not.toBeNull();
		expect(result!.viewingId).toBe(viewingId);
		expect(result!.tmdbId).toBe(tmdbId);
	});

	it("extracts viewing ID from real HTML", async () => {
		// Fetch real page and test extraction function
		const { text } = await fetchUrl(EXPECTED_ENTRIES.dieHard.letterboxdUri);

		const viewingId = extractViewingIdFromHtml(text);

		expect(viewingId).toBe(EXPECTED_ENTRIES.dieHard.viewingId);
	});

	it("extracts TMDB ID from real film page", async () => {
		const { text } = await fetchUrl("https://letterboxd.com/film/die-hard/");

		const tmdbId = extractTmdbId(text);

		expect(tmdbId).toBe(EXPECTED_ENTRIES.dieHard.tmdbId);
	});
});

// ============================================================================
// E2E 1: RSS Sync Flow
// ============================================================================

describe("E2E 1: RSS Sync Flow", () => {
	it("fetches RSS feed for test account", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		expect(entries.length).toBeGreaterThan(0);
	});

	it("parses all expected entries from RSS", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		// Find Die Hard entry
		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard).toBeDefined();
		expect(dieHard!.filmYear).toBe(EXPECTED_ENTRIES.dieHard.filmYear);
		expect(dieHard!.tmdbId).toBe(EXPECTED_ENTRIES.dieHard.tmdbId);
		expect(dieHard!.userRatingNo).toBe(EXPECTED_ENTRIES.dieHard.rating);
		expect(dieHard!.rewatch).toBe(EXPECTED_ENTRIES.dieHard.rewatch);
		expect(dieHard!.watchedDate).toBe(EXPECTED_ENTRIES.dieHard.watchedDate);

		// Find One Battle After Another entry
		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle).toBeDefined();
		expect(oneBattle!.filmYear).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.filmYear);
		expect(oneBattle!.tmdbId).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.tmdbId);
		expect(oneBattle!.userRatingNo).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.rating);
		expect(oneBattle!.rewatch).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.rewatch);
	});

	it("extracts viewing ID (GUID) from RSS entries", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.guid).toBe(EXPECTED_ENTRIES.dieHard.viewingId);

		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle!.guid).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.viewingId);
	});

	it("extracts poster URLs from RSS", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		for (const entry of entries) {
			expect(entry.posterUrl).toMatch(/^https:\/\/.*\.jpg/);
		}
	});

	it("extracts review text from RSS", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.review).toContain(EXPECTED_ENTRIES.dieHard.review);
	});
});

// ============================================================================
// E2E 2: CSV Import Flow
// ============================================================================

describe("E2E 2: CSV Import Flow", () => {
	it("parses diary.csv and reviews.csv from fixtures", async () => {
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");

		const progressCalls: { current: number; total: number; title: string }[] = [];

		const entries = await parseLetterboxdExport(
			diaryCSV,
			reviewsCSV,
			(current, total, title) => {
				progressCalls.push({ current, total, title });
			}
		);

		// Should have entries
		expect(entries.length).toBeGreaterThan(0);

		// Progress callback should be called
		expect(progressCalls.length).toBe(entries.length);
	});

	it("enriches CSV entries with viewing ID and TMDB ID", async () => {
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");

		const entries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		// Find Die Hard entry
		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard).toBeDefined();
		expect(dieHard!.guid).toBe(EXPECTED_ENTRIES.dieHard.viewingId);
		expect(dieHard!.tmdbId).toBe(EXPECTED_ENTRIES.dieHard.tmdbId);

		// Find One Battle After Another entry
		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle).toBeDefined();
		expect(oneBattle!.guid).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.viewingId);
		expect(oneBattle!.tmdbId).toBe(EXPECTED_ENTRIES.oneBattleAfterAnother.tmdbId);
	});

	it("merges reviews from reviews.csv into diary entries", async () => {
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");

		const entries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.review).toContain(EXPECTED_ENTRIES.dieHard.review);
	});

	it("parses tags from CSV", async () => {
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");

		const entries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.tags).toContain("at home");

		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle!.tags).toContain("at the cinema");
	});
});

// ============================================================================
// E2E 7: Rewatch Handling
// ============================================================================

describe("E2E 7: Rewatch Handling", () => {
	it("marks rewatch entries correctly from RSS", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.rewatch).toBe(true);

		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle!.rewatch).toBe(false);
	});

	it("marks rewatch entries correctly from CSV", async () => {
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");

		const entries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		const dieHard = entries.find((e) => e.filmTitle === "Die Hard");
		expect(dieHard!.rewatch).toBe(true);

		const oneBattle = entries.find((e) => e.filmTitle === "One Battle After Another");
		expect(oneBattle!.rewatch).toBe(false);
	});

	it("each viewing has unique viewing ID", async () => {
		const entries = await fetchLetterboxdRSS(TEST_USERNAME);

		const guids = entries.map((e) => e.guid);
		const uniqueGuids = new Set(guids);

		expect(uniqueGuids.size).toBe(guids.length);
	});
});

// ============================================================================
// E2E 4: TMDB Film Note Creation
// ============================================================================

describe("E2E 4: TMDB API", () => {
	const runTMDBTests = hasTMDBApiKey();

	it.skipIf(!runTMDBTests)("fetches Die Hard movie data from TMDB", async () => {
		const apiKey = getTMDBApiKey();
		const movie = await fetchTMDBMovie(EXPECTED_ENTRIES.dieHard.tmdbId, apiKey);

		expect(movie.tmdbId).toBe(parseInt(EXPECTED_ENTRIES.dieHard.tmdbId));
		expect(movie.title).toBe("Die Hard");
		expect(movie.year).toBe(1988);
		expect(movie.genres.length).toBeGreaterThan(0);
	});

	it.skipIf(!runTMDBTests)("fetches One Battle After Another movie data from TMDB", async () => {
		const apiKey = getTMDBApiKey();
		const movie = await fetchTMDBMovie(EXPECTED_ENTRIES.oneBattleAfterAnother.tmdbId, apiKey);

		expect(movie.tmdbId).toBe(parseInt(EXPECTED_ENTRIES.oneBattleAfterAnother.tmdbId));
		expect(movie.title).toBe("One Battle After Another");
		expect(movie.year).toBe(2025);
	});

	it.skipIf(!runTMDBTests)("fetches movie with credits data", async () => {
		const apiKey = getTMDBApiKey();
		const includeCredits = true;
		const movie = await fetchTMDBMovie(
			EXPECTED_ENTRIES.dieHard.tmdbId,
			apiKey,
			"en-US",
			includeCredits
		);

		expect(movie.cast.length).toBeGreaterThan(0);
		expect(movie.directors.length).toBeGreaterThan(0);
		expect(movie.directors).toContain("John McTiernan");
	});

	it.skipIf(!runTMDBTests)("returns poster URLs in various sizes", async () => {
		const apiKey = getTMDBApiKey();
		const movie = await fetchTMDBMovie(EXPECTED_ENTRIES.dieHard.tmdbId, apiKey);

		expect(movie.posterUrlM).toMatch(/^https:\/\/image\.tmdb\.org/);
		expect(movie.posterUrlL).toMatch(/^https:\/\/image\.tmdb\.org/);
		expect(movie.backdropUrlM).toMatch(/^https:\/\/image\.tmdb\.org/);
	});
});

// ============================================================================
// Data Consistency Tests
// ============================================================================

describe("Data Consistency: RSS vs CSV", () => {
	it("RSS and CSV produce matching entries", async () => {
		const rssEntries = await fetchLetterboxdRSS(TEST_USERNAME);

		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvEntries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		// Find Die Hard in both
		const rssDieHard = rssEntries.find((e) => e.filmTitle === "Die Hard");
		const csvDieHard = csvEntries.find((e) => e.filmTitle === "Die Hard");

		expect(rssDieHard).toBeDefined();
		expect(csvDieHard).toBeDefined();

		// Same viewing ID
		expect(rssDieHard!.guid).toBe(csvDieHard!.guid);

		// Same TMDB ID
		expect(rssDieHard!.tmdbId).toBe(csvDieHard!.tmdbId);

		// Same basic data
		expect(rssDieHard!.filmYear).toBe(csvDieHard!.filmYear);
		expect(rssDieHard!.userRatingNo).toBe(csvDieHard!.userRatingNo);
		expect(rssDieHard!.rewatch).toBe(csvDieHard!.rewatch);
		expect(rssDieHard!.watchedDate).toBe(csvDieHard!.watchedDate);
	});

	it("RSS and CSV both provide tags", async () => {
		const rssEntries = await fetchLetterboxdRSS(TEST_USERNAME);

		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvEntries = await parseLetterboxdExport(diaryCSV, reviewsCSV);

		const rssDieHard = rssEntries.find((e) => e.filmTitle === "Die Hard");
		const csvDieHard = csvEntries.find((e) => e.filmTitle === "Die Hard");

		// RSS now fetches tags from viewing pages
		expect(rssDieHard!.tags).toContain("at home");
		expect(rssDieHard!.tags).not.toContain("_pending_csv_import");

		// CSV has real tags
		expect(csvDieHard!.tags).not.toContain("_pending_csv_import");
		expect(csvDieHard!.tags).toContain("at home");
	});
});

// ============================================================================
// E2E 1b: RSS Sync with Mock Vault
// ============================================================================

describe("E2E 1b: RSS Sync with Mock Vault", () => {
	let vaultPath: string;

	beforeEach(() => {
		vaultPath = createTempVault();
	});

	afterEach(() => {
		cleanupTempVault(vaultPath);
	});

	it("creates diary notes from RSS sync", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		const result = await syncDiary(plugin as unknown as LetterboxdPlugin);

		expect(result.created).toBeGreaterThan(0);
		expect(result.errors).toBe(0);

		// Verify notes were created
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		expect(notes.length).toBe(result.created);
	});

	it("creates notes with correct GUID in frontmatter", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		await syncDiary(plugin as unknown as LetterboxdPlugin);

		// Find Die Hard note
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		const dieHardNote = notes.find((n) => n.includes("Die Hard"));
		expect(dieHardNote).toBeDefined();

		// Read and verify content
		const content = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);
		expect(content).toContain(`letterboxd_guid: ${EXPECTED_ENTRIES.dieHard.viewingId}`);
		expect(content).toContain(`tmdb_id: ${EXPECTED_ENTRIES.dieHard.tmdbId}`);
	});

	it("skips existing notes on second sync (deduplication)", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		// First sync
		const result1 = await syncDiary(plugin as unknown as LetterboxdPlugin);
		expect(result1.created).toBeGreaterThan(0);

		// Second sync - should skip all
		const result2 = await syncDiary(plugin as unknown as LetterboxdPlugin);
		expect(result2.created).toBe(0);
		expect(result2.skipped).toBe(result1.created);
	});

	it("collects TMDB IDs for new entries", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		const result = await syncDiary(plugin as unknown as LetterboxdPlugin);

		expect(result.createdTmdbIds.length).toBeGreaterThan(0);
		expect(result.createdTmdbIds).toContain(EXPECTED_ENTRIES.dieHard.tmdbId);
		expect(result.createdTmdbIds).toContain(EXPECTED_ENTRIES.oneBattleAfterAnother.tmdbId);
	});
});

// ============================================================================
// E2E 3: CSV + Existing Notes
// ============================================================================

describe("E2E 3: CSV + Existing Notes", () => {
	let vaultPath: string;

	beforeEach(() => {
		vaultPath = createTempVault();
	});

	afterEach(() => {
		cleanupTempVault(vaultPath);
	});

	it("updates frontmatter of existing notes from CSV", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		// First, sync from RSS to create notes with tags from viewing pages
		await syncDiary(plugin as unknown as LetterboxdPlugin);

		// Verify tags are present from RSS (now fetched from viewing pages)
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		const dieHardNote = notes.find((n) => n.includes("Die Hard"));
		let content = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);
		expect(content).toContain("at home");
		expect(content).not.toContain("_pending_csv_import");

		// Now import CSV - should skip since tags already match
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvResult = await importFromCSV(
			plugin as unknown as LetterboxdPlugin,
			diaryCSV,
			reviewsCSV
		);

		// Since RSS now provides tags, CSV import should mostly skip (no changes needed)
		// Some notes may still be updated if other fields differ
		expect(csvResult.errors.length).toBe(0);

		// Verify tags are still present
		content = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);
		expect(content).not.toContain("_pending_csv_import");
		expect(content).toContain("at home");
	});

	it("preserves body content when updating frontmatter", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		// First, sync from RSS
		await syncDiary(plugin as unknown as LetterboxdPlugin);

		// Get original note content
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		const dieHardNote = notes.find((n) => n.includes("Die Hard"));
		const originalContent = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);

		// Extract body (everything after frontmatter)
		const bodyMatch = originalContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
		const originalBody = bodyMatch ? bodyMatch[1] : "";

		// Import CSV
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		await importFromCSV(plugin as unknown as LetterboxdPlugin, diaryCSV, reviewsCSV);

		// Verify body is preserved
		const updatedContent = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);
		const updatedBodyMatch = updatedContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
		const updatedBody = updatedBodyMatch ? updatedBodyMatch[1] : "";

		expect(updatedBody).toBe(originalBody);
	});

	it("does not overwrite immutable fields (guid, tmdbId)", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		// First, sync from RSS
		await syncDiary(plugin as unknown as LetterboxdPlugin);

		// Get original values
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		const dieHardNote = notes.find((n) => n.includes("Die Hard"));
		const originalContent = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);

		const originalGuidMatch = originalContent.match(/letterboxd_guid:\s*(\d+)/);
		const originalTmdbMatch = originalContent.match(/tmdb_id:\s*(\d+)/);
		const originalGuid = originalGuidMatch ? originalGuidMatch[1] : "";
		const originalTmdb = originalTmdbMatch ? originalTmdbMatch[1] : "";

		// Import CSV
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		await importFromCSV(plugin as unknown as LetterboxdPlugin, diaryCSV, reviewsCSV);

		// Verify immutable fields are unchanged
		const updatedContent = readNoteFromVault(vaultPath, `Letterboxd/${dieHardNote}.md`);
		expect(updatedContent).toContain(`letterboxd_guid: ${originalGuid}`);
		expect(updatedContent).toContain(`tmdb_id: ${originalTmdb}`);
	});

	it("creates new notes for entries not in vault", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
		});

		// Start with empty vault, import CSV directly
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const result = await importFromCSV(
			plugin as unknown as LetterboxdPlugin,
			diaryCSV,
			reviewsCSV
		);

		expect(result.created).toBeGreaterThan(0);
		expect(result.errors.length).toBe(0);

		// Verify notes exist
		const notes = listNotesInVault(vaultPath, "Letterboxd");
		expect(notes.length).toBe(result.created);
	});
});

// ============================================================================
// E2E 5: Full Pipeline (CSV -> Diary Notes -> Film Notes)
// ============================================================================

describe("E2E 5: Full Pipeline", () => {
	let vaultPath: string;
	const runTMDBTests = hasTMDBApiKey();

	beforeEach(() => {
		vaultPath = createTempVault();
	});

	afterEach(() => {
		cleanupTempVault(vaultPath);
	});

	it.skipIf(!runTMDBTests)("creates diary notes and film notes from CSV", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
			tmdbFolderPath: "Films",
			tmdbApiKey: getTMDBApiKey(),
		});

		// Step 1: Import CSV to create diary notes
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvResult = await importFromCSV(
			plugin as unknown as LetterboxdPlugin,
			diaryCSV,
			reviewsCSV
		);

		expect(csvResult.created).toBeGreaterThan(0);
		expect(csvResult.newTmdbIds.length).toBeGreaterThan(0);

		// Step 2: Create Film notes from TMDB IDs
		const tmdbResult = await syncFilmsFromTMDB(
			plugin as unknown as LetterboxdPlugin,
			csvResult.newTmdbIds
		);

		expect(tmdbResult.created).toBeGreaterThan(0);
		expect(tmdbResult.errors).toBe(0);

		// Verify diary notes exist
		const diaryNotes = listNotesInVault(vaultPath, "Letterboxd");
		expect(diaryNotes.length).toBe(csvResult.created);

		// Verify film notes exist
		const filmNotes = listNotesInVault(vaultPath, "Films");
		expect(filmNotes.length).toBe(tmdbResult.created);
	});

	it.skipIf(!runTMDBTests)("does not create duplicate film notes for rewatches", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
			tmdbFolderPath: "Films",
			tmdbApiKey: getTMDBApiKey(),
		});

		// Import CSV
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvResult = await importFromCSV(
			plugin as unknown as LetterboxdPlugin,
			diaryCSV,
			reviewsCSV
		);

		// newTmdbIds should not have duplicates
		const uniqueIds = new Set(csvResult.newTmdbIds);
		expect(uniqueIds.size).toBe(csvResult.newTmdbIds.length);

		// Create film notes
		const tmdbResult = await syncFilmsFromTMDB(
			plugin as unknown as LetterboxdPlugin,
			csvResult.newTmdbIds
		);

		// Running again should create 0 new notes
		const tmdbResult2 = await syncFilmsFromTMDB(
			plugin as unknown as LetterboxdPlugin,
			csvResult.newTmdbIds
		);

		expect(tmdbResult2.created).toBe(0);
		expect(tmdbResult2.skipped).toBe(tmdbResult.created);
	});

	it.skipIf(!runTMDBTests)("film notes have correct TMDB ID in frontmatter", async () => {
		const plugin = new MockPlugin(vaultPath, {
			username: TEST_USERNAME,
			folderPath: "Letterboxd",
			tmdbFolderPath: "Films",
			tmdbApiKey: getTMDBApiKey(),
		});

		// Import and create film notes
		const diaryCSV = readFixtureCSV("diary.csv");
		const reviewsCSV = readFixtureCSV("reviews.csv");
		const csvResult = await importFromCSV(
			plugin as unknown as LetterboxdPlugin,
			diaryCSV,
			reviewsCSV
		);

		await syncFilmsFromTMDB(plugin as unknown as LetterboxdPlugin, csvResult.newTmdbIds);

		// Find Die Hard film note
		const filmNotes = listNotesInVault(vaultPath, "Films");
		const dieHardFilm = filmNotes.find((n) => n.includes("Die Hard"));
		expect(dieHardFilm).toBeDefined();

		// Verify TMDB ID in frontmatter
		const content = readNoteFromVault(vaultPath, `Films/${dieHardFilm}.md`);
		expect(content).toContain(`tmdb_id: ${EXPECTED_ENTRIES.dieHard.tmdbId}`);
	});
});
