/**
 * TMDB API response types and internal representations
 */

/** TMDB image base URL */
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

/** TMDB website base URL */
export const TMDB_WEB_BASE_URL = "https://www.themoviedb.org/movie";

/** Poster size options with their TMDB API size codes */
export const POSTER_SIZES = {
	XXS: "w92",
	XS: "w154",
	S: "w185",
	M: "w342",
	L: "w500",
	XL: "w780",
	OG: "original",
} as const;

/** Backdrop size options with their TMDB API size codes */
export const BACKDROP_SIZES = {
	S: "w300",
	M: "w780",
	L: "w1280",
	OG: "original",
} as const;

/** Genre object from TMDB API */
export interface TMDBGenre {
	id: number;
	name: string;
}

/** Production company from TMDB API */
export interface TMDBProductionCompany {
	id: number;
	name: string;
	logo_path: string | null;
	origin_country: string;
}

/** Spoken language from TMDB API */
export interface TMDBSpokenLanguage {
	iso_639_1: string;
	name: string;
	english_name: string;
}

/** Cast member from TMDB credits */
export interface TMDBCastMember {
	id: number;
	name: string;
	character: string;
	order: number;
}

/** Crew member from TMDB credits */
export interface TMDBCrewMember {
	id: number;
	name: string;
	job: string;
	department: string;
}

/** Credits response from TMDB API */
export interface TMDBCredits {
	cast: TMDBCastMember[];
	crew: TMDBCrewMember[];
}

/**
 * Raw response from TMDB /movie/{id} endpoint
 */
export interface TMDBMovieResponse {
	id: number;
	title: string;
	original_title: string;
	original_language: string;
	overview: string | null;
	tagline: string | null;
	release_date: string; // YYYY-MM-DD
	runtime: number | null; // minutes
	status: string;
	poster_path: string | null;
	backdrop_path: string | null;
	vote_average: number;
	vote_count: number;
	popularity: number;
	budget: number;
	revenue: number;
	imdb_id: string | null;
	genres: TMDBGenre[];
	production_companies: TMDBProductionCompany[];
	spoken_languages: TMDBSpokenLanguage[];
	belongs_to_collection: {
		id: number;
		name: string;
		poster_path: string | null;
		backdrop_path: string | null;
	} | null;
	/** Credits data (only present if append_to_response=credits) */
	credits?: TMDBCredits;
}

/**
 * Processed movie data for template rendering
 */
export interface TMDBMovie {
	/** TMDB movie ID */
	tmdbId: number;
	/** Movie title */
	title: string;
	/** Original title (may differ for foreign films) */
	originalTitle: string;
	/** Original language code (e.g., "en") */
	originalLanguage: string;
	/** Release year extracted from release_date */
	year: number;
	/** Full release date (YYYY-MM-DD) */
	releaseDate: string;
	/** Runtime in minutes */
	runtime: number;
	/** Formatted runtime (e.g., "2h 36m") */
	runtimeFormatted: string;
	/** Plot overview/synopsis */
	overview: string;
	/** Movie tagline */
	tagline: string;
	/** Array of genre names */
	genres: string[];
	/** Comma-separated genre list */
	genreList: string;
	/** TMDB community rating (0-10) */
	tmdbRating: number;
	/** Number of votes on TMDB */
	tmdbVoteCount: number;
	/** Budget in dollars */
	budget: number;
	/** Revenue in dollars */
	revenue: number;
	/** IMDb ID (e.g., "tt1234567") */
	imdbId: string;
	/** URL to TMDB page */
	tmdbUrl: string;
	/** Poster URLs in different sizes */
	posterUrlXXS: string;
	posterUrlXS: string;
	posterUrlS: string;
	posterUrlM: string;
	posterUrlL: string;
	posterUrlXL: string;
	posterUrlOG: string;
	/** Backdrop URLs in different sizes */
	backdropUrlS: string;
	backdropUrlM: string;
	backdropUrlL: string;
	backdropUrlOG: string;
	/** Production company names */
	productionCompanies: string[];
	/** Comma-separated production companies */
	productionCompanyList: string;
	/** Spoken language names */
	spokenLanguages: string[];
	/** Comma-separated spoken languages */
	spokenLanguageList: string;
	/** Collection name if part of a series */
	collection: string;
	/** Array of cast member names (actors) */
	cast: string[];
	/** Array of character names (in same order as cast) */
	characters: string[];
	/** Array of director names */
	directors: string[];
}

/**
 * TMDB-specific settings
 */
export interface TMDBSettings {
	/** TMDB API Read Access Token (Bearer token) */
	tmdbApiKey: string;
	/** Folder path for Film notes */
	tmdbFolderPath: string;
	/** Filename template for Film notes */
	tmdbFilenameTemplate: string;
	/** Note content template for Film notes */
	tmdbNoteTemplate: string;
	/** Preferred language for TMDB data (e.g., "en-US") */
	tmdbLanguage: string;
	/** Frontmatter key used to store TMDB ID for deduplication */
	tmdbIdFrontmatterKey: string;
}
