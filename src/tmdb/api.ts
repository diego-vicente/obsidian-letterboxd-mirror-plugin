import { requestUrl } from "obsidian";
import type { TMDBMovie, TMDBMovieResponse } from "./types";
import {
	TMDB_IMAGE_BASE_URL,
	TMDB_WEB_BASE_URL,
	POSTER_SIZES,
	BACKDROP_SIZES,
} from "./types";

/** TMDB API base URL */
const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Builds a full image URL from a TMDB path and size
 * @param path - Image path from TMDB API (e.g., "/abc123.jpg")
 * @param size - Size code (e.g., "w500", "original")
 * @returns Full URL or empty string if path is null
 */
function buildImageUrl(path: string | null, size: string): string {
	if (!path) {
		return "";
	}
	return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Formats runtime in minutes to human-readable format
 * @param minutes - Runtime in minutes
 * @returns Formatted string like "2h 36m" or empty if no runtime
 */
function formatRuntime(minutes: number | null): string {
	if (!minutes || minutes <= 0) {
		return "";
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (hours === 0) {
		return `${mins}m`;
	}
	if (mins === 0) {
		return `${hours}h`;
	}
	return `${hours}h ${mins}m`;
}

/**
 * Extracts year from a date string
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Year as number or 0 if invalid
 */
function extractYear(dateStr: string): number {
	if (!dateStr || dateStr.length < 4) {
		return 0;
	}
	const year = parseInt(dateStr.substring(0, 4), 10);
	return isNaN(year) ? 0 : year;
}

/**
 * Transforms raw TMDB API response into processed TMDBMovie object
 * @param response - Raw API response
 * @returns Processed movie data ready for template rendering
 */
function transformResponse(response: TMDBMovieResponse): TMDBMovie {
	const genres = response.genres.map((g) => g.name);
	const productionCompanies = response.production_companies.map((c) => c.name);
	const spokenLanguages = response.spoken_languages.map(
		(l) => l.english_name || l.name
	);

	// Extract credits if available
	const credits = response.credits;
	const castMembers = credits?.cast || [];
	const crewMembers = credits?.crew || [];

	// Sort cast by billing order and extract names/characters separately
	const sortedCast = [...castMembers].sort((a, b) => a.order - b.order);
	const cast = sortedCast.map((c) => c.name);
	const characters = sortedCast.map((c) => c.character);

	// Extract directors from crew
	const directors = crewMembers
		.filter((c) => c.job === "Director")
		.map((c) => c.name);

	return {
		tmdbId: response.id,
		title: response.title,
		originalTitle: response.original_title,
		originalLanguage: response.original_language,
		year: extractYear(response.release_date),
		releaseDate: response.release_date || "",
		runtime: response.runtime || 0,
		runtimeFormatted: formatRuntime(response.runtime),
		overview: response.overview || "",
		tagline: response.tagline || "",
		genres,
		genreList: genres.join(", "),
		tmdbRating: response.vote_average,
		tmdbVoteCount: response.vote_count,
		budget: response.budget,
		revenue: response.revenue,
		imdbId: response.imdb_id || "",
		tmdbUrl: `${TMDB_WEB_BASE_URL}/${response.id}`,
		// Poster URLs in all sizes
		posterUrlXXS: buildImageUrl(response.poster_path, POSTER_SIZES.XXS),
		posterUrlXS: buildImageUrl(response.poster_path, POSTER_SIZES.XS),
		posterUrlS: buildImageUrl(response.poster_path, POSTER_SIZES.S),
		posterUrlM: buildImageUrl(response.poster_path, POSTER_SIZES.M),
		posterUrlL: buildImageUrl(response.poster_path, POSTER_SIZES.L),
		posterUrlXL: buildImageUrl(response.poster_path, POSTER_SIZES.XL),
		posterUrlOG: buildImageUrl(response.poster_path, POSTER_SIZES.OG),
		// Backdrop URLs in all sizes
		backdropUrlS: buildImageUrl(response.backdrop_path, BACKDROP_SIZES.S),
		backdropUrlM: buildImageUrl(response.backdrop_path, BACKDROP_SIZES.M),
		backdropUrlL: buildImageUrl(response.backdrop_path, BACKDROP_SIZES.L),
		backdropUrlOG: buildImageUrl(response.backdrop_path, BACKDROP_SIZES.OG),
		productionCompanies,
		productionCompanyList: productionCompanies.join(", "),
		spokenLanguages,
		spokenLanguageList: spokenLanguages.join(", "),
		collection: response.belongs_to_collection?.name || "",
		// Credits
		cast,
		characters,
		directors,
	};
}

/** Template variables that require credits data */
const CREDITS_VARIABLES = ["cast", "characters", "castWithRoles", "directors"];

/**
 * Checks if a template uses any credits-related variables
 * Matches both {{variable}} and {{variable param=value}} syntax
 * @param template - Template string to check
 * @returns true if credits data is needed
 */
export function templateNeedsCredits(template: string): boolean {
	// Match {{variableName}} or {{variableName param=value...}}
	return CREDITS_VARIABLES.some((v) => {
		const pattern = new RegExp(`\\{\\{${v}(\\s|\\})`);
		return pattern.test(template);
	});
}

/**
 * Fetches movie details from TMDB API
 * @param tmdbId - TMDB movie ID
 * @param apiKey - TMDB API Read Access Token (Bearer token)
 * @param language - Language code (e.g., "en-US")
 * @param includeCredits - Whether to fetch credits (cast/crew) data
 * @returns Processed movie data
 * @throws Error if fetch fails or movie not found
 */
export async function fetchTMDBMovie(
	tmdbId: string | number,
	apiKey: string,
	language = "en-US",
	includeCredits = false
): Promise<TMDBMovie> {
	if (!tmdbId) {
		throw new Error("TMDB ID is required");
	}
	if (!apiKey) {
		throw new Error("TMDB API key is required");
	}

	let url = `${TMDB_API_BASE_URL}/movie/${tmdbId}?language=${language}`;
	if (includeCredits) {
		url += "&append_to_response=credits";
	}

	const response = await requestUrl({
		url,
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
	});

	if (response.status === 404) {
		throw new Error(`Movie not found: ${tmdbId}`);
	}

	if (response.status === 401) {
		throw new Error("Invalid TMDB API key");
	}

	if (response.status !== 200) {
		throw new Error(`TMDB API error: HTTP ${response.status}`);
	}

	const data = response.json as TMDBMovieResponse;
	return transformResponse(data);
}

/**
 * Validates a TMDB API key by making a test request
 * @param apiKey - TMDB API Read Access Token
 * @returns true if valid, false otherwise
 */
export async function validateTMDBApiKey(apiKey: string): Promise<boolean> {
	if (!apiKey) {
		return false;
	}

	try {
		// Use a known movie ID (Fight Club) to test the API key
		const testMovieId = 550;
		await fetchTMDBMovie(testMovieId, apiKey);
		return true;
	} catch {
		return false;
	}
}
