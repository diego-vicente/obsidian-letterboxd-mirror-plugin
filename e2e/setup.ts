/**
 * E2E Test Setup
 *
 * Provides utilities for E2E tests.
 * Note: The obsidian mock is handled via vitest alias in vitest.e2e.config.ts
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Test Account Constants
// ============================================================================

/** Letterboxd test account username */
export const TEST_USERNAME = "e2e_test_acc";

/** Path to test fixtures (CSV export from test account) */
export const FIXTURES_PATH = path.resolve(
	__dirname,
	"../assets/letterboxd-e2e_test_acc-2025-12-25-11-03-utc"
);

// ============================================================================
// Expected Test Data
// ============================================================================

/**
 * Known entries from the test account.
 * These should match the actual diary entries in e2e_test_acc.
 * Update these if the test account data changes.
 */
export const EXPECTED_ENTRIES = {
	dieHard: {
		filmTitle: "Die Hard",
		filmYear: 1988,
		tmdbId: "562",
		viewingId: "1119837402",
		letterboxdUri: "https://boxd.it/cdReDP",
		rating: 4.5,
		rewatch: true,
		watchedDate: "2025-12-25",
		tags: ["at home"],
		review: "Best Christmas movie ever",
	},
	oneBattleAfterAnother: {
		filmTitle: "One Battle After Another",
		filmYear: 2025,
		tmdbId: "1054867",
		viewingId: "1119839361",
		letterboxdUri: "https://boxd.it/cdRjJN",
		rating: 5.0,
		rewatch: false,
		watchedDate: "2025-10-05",
		tags: ["at the cinema"],
		review: "My 2025 top pick",
	},
} as const;

// ============================================================================
// Fixture Utilities
// ============================================================================

/**
 * Reads a CSV file from the test fixtures
 */
export function readFixtureCSV(filename: string): string {
	const filePath = path.join(FIXTURES_PATH, filename);
	return fs.readFileSync(filePath, "utf-8");
}

/** Minimum length for a valid TMDB Read Access Token (v4) */
const MIN_READ_ACCESS_TOKEN_LENGTH = 100;

/**
 * Gets the TMDB API key from environment variable
 *
 * Note: TMDB has two authentication methods:
 * - API Key (v3): Short key passed as query param (won't work with our code)
 * - Read Access Token (v4): Long token passed as Bearer header (what we use)
 *
 * The token should be ~200 characters long. If you have a short API key,
 * you need to get a Read Access Token from TMDB settings.
 *
 * @throws Error if not set or if it's a v3 API key instead of v4 Read Access Token
 */
export function getTMDBApiKey(): string {
	const apiKey = process.env.TMDB_API_KEY;
	if (!apiKey) {
		throw new Error("TMDB_API_KEY environment variable is required for TMDB E2E tests");
	}

	if (apiKey.length < MIN_READ_ACCESS_TOKEN_LENGTH) {
		throw new Error(
			`TMDB_API_KEY appears to be a v3 API key (${apiKey.length} chars). ` +
				`This plugin requires a v4 Read Access Token (~200 chars). ` +
				`Get one from: https://www.themoviedb.org/settings/api`
		);
	}

	return apiKey;
}

/**
 * Checks if TMDB API key is available and is a Read Access Token (v4)
 * Read Access Tokens are ~200 characters, v3 API keys are ~32 characters
 */
export function hasTMDBApiKey(): boolean {
	const apiKey = process.env.TMDB_API_KEY;
	if (!apiKey) return false;

	if (apiKey.length < MIN_READ_ACCESS_TOKEN_LENGTH) {
		console.warn(
			`[E2E Setup] TMDB_API_KEY appears to be a v3 API key (${apiKey.length} chars). ` +
				`The code requires a v4 Read Access Token (~200 chars). ` +
				`Get one from: https://www.themoviedb.org/settings/api`
		);
		return false;
	}

	return true;
}

// ============================================================================
// Direct HTTP Utilities (for tests that don't use the mocked modules)
// ============================================================================

/**
 * Simple HTTP fetch wrapper for direct testing
 */
export async function fetchUrl(url: string): Promise<{ status: number; text: string }> {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (compatible; LetterboxdMirror-E2E/1.0)",
		},
	});

	const text = await response.text();
	return {
		status: response.status,
		text,
	};
}

/**
 * Fetches JSON from a URL with optional authorization header
 */
export async function fetchJson<T>(
	url: string,
	bearerToken?: string
): Promise<{ status: number; json: T }> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (bearerToken) {
		headers["Authorization"] = `Bearer ${bearerToken}`;
	}

	const response = await fetch(url, { headers });
	const json = (await response.json()) as T;

	return {
		status: response.status,
		json,
	};
}
