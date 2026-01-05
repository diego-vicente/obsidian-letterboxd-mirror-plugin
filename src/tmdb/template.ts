import type { TMDBMovie } from "./types";
import {
	renderTemplate as etaRender,
	generateFilename as etaGenerateFilename,
} from "../eta/engine";
import { str, arr, num, poster, backdrop, FluentArray, FluentImage } from "../eta/fluent";
import type { FluentString, FluentNumber } from "../eta/fluent";

/**
 * Wrapped TMDB movie data for Eta templates
 * All properties are fluent wrappers enabling chainable methods
 */
interface WrappedTMDBMovie {
	// Core identifiers
	tmdbId: FluentNumber;
	imdbId: FluentString;
	tmdbUrl: FluentString;

	// Titles
	title: FluentString;
	originalTitle: FluentString;
	originalLanguage: FluentString;

	// Dates and timing
	year: FluentNumber;
	releaseDate: FluentString;
	runtime: FluentNumber;
	runtimeFormatted: FluentString;

	// Content
	overview: FluentString;
	tagline: FluentString;

	// Genres
	genres: FluentArray;

	// Ratings
	tmdbRating: FluentNumber;
	tmdbVoteCount: FluentNumber;

	// Financials
	budget: FluentNumber;
	revenue: FluentNumber;

	// Images - use .size("L") or .size(500)
	poster: FluentImage;
	backdrop: FluentImage;

	// Production info
	productionCompanies: FluentArray;
	spokenLanguages: FluentArray;
	collection: FluentString;

	// Credits
	cast: FluentArray;
	characters: FluentArray;
	directors: FluentArray;

	// Special: Cast with roles helper
	castWithRoles: CastWithRolesHelper;
}

/**
 * Helper class for generating "Actor as Character" formatted output
 * Supports fluent chaining for formatting options
 */
class CastWithRolesHelper {
	private castList: string[];
	private characterList: string[];
	private maxItems?: number;
	private linkActorsFlag = false;
	private linkCharactersFlag = false;

	constructor(cast: string[], characters: string[]) {
		this.castList = cast;
		this.characterList = characters;
	}

	/** Limit to top N cast members */
	top(n: number): CastWithRolesHelper {
		const helper = new CastWithRolesHelper(this.castList, this.characterList);
		helper.maxItems = n;
		helper.linkActorsFlag = this.linkActorsFlag;
		helper.linkCharactersFlag = this.linkCharactersFlag;
		return helper;
	}

	/** Enable wiki-links for actor names */
	linkActors(): CastWithRolesHelper {
		const helper = new CastWithRolesHelper(this.castList, this.characterList);
		helper.maxItems = this.maxItems;
		helper.linkActorsFlag = true;
		helper.linkCharactersFlag = this.linkCharactersFlag;
		return helper;
	}

	/** Enable wiki-links for character names */
	linkCharacters(): CastWithRolesHelper {
		const helper = new CastWithRolesHelper(this.castList, this.characterList);
		helper.maxItems = this.maxItems;
		helper.linkActorsFlag = this.linkActorsFlag;
		helper.linkCharactersFlag = true;
		return helper;
	}

	/** Build the roles array */
	private buildRoles(): string[] {
		const limit = this.maxItems ?? this.castList.length;
		const roles: string[] = [];

		for (let i = 0; i < Math.min(limit, this.castList.length); i++) {
			let actor = this.castList[i];
			let character = this.characterList[i] || "";

			if (this.linkActorsFlag) {
				actor = `[[${actor}]]`;
			}
			if (this.linkCharactersFlag && character) {
				character = `[[${character}]]`;
			}

			roles.push(`${actor} as ${character}`);
		}

		return roles;
	}

	/** Get as FluentArray for further chaining */
	toArray(): FluentArray {
		return new FluentArray(this.buildRoles());
	}

	/** Format as comma-separated string */
	toString(): string {
		return this.buildRoles().join(", ");
	}

	/** Format as bullet list */
	bullet(): string {
		return this.buildRoles()
			.map((role) => `- ${role}`)
			.join("\n");
	}

	/** Format as YAML inline array */
	yaml(): string {
		const roles = this.buildRoles();
		const quoted = roles.map((r) => `"${r.replace(/"/g, '\\"')}"`);
		return `[${quoted.join(", ")}]`;
	}

	/** Format as YAML multiline list (indented for frontmatter) */
	yamlMultiline(): string {
		return this.buildRoles()
			.map((role) => `  - ${role}`)
			.join("\n");
	}
}

/**
 * Transforms a TMDBMovie into wrapped data for Eta templates
 */
function wrapTMDBMovie(movie: TMDBMovie): WrappedTMDBMovie {
	// Extract poster and backdrop paths from the full URLs
	// URLs are like: https://image.tmdb.org/t/p/w500/abc123.jpg
	// We need just: /abc123.jpg
	const posterPath = extractImagePath(movie.posterUrlOG);
	const backdropPath = extractImagePath(movie.backdropUrlOG);

	return {
		// Core identifiers
		tmdbId: num(movie.tmdbId),
		imdbId: str(movie.imdbId),
		tmdbUrl: str(movie.tmdbUrl),

		// Titles
		title: str(movie.title),
		originalTitle: str(movie.originalTitle),
		originalLanguage: str(movie.originalLanguage),

		// Dates and timing
		year: num(movie.year),
		releaseDate: str(movie.releaseDate),
		runtime: num(movie.runtime),
		runtimeFormatted: str(movie.runtimeFormatted),

		// Content
		overview: str(movie.overview),
		tagline: str(movie.tagline),

		// Genres
		genres: arr(movie.genres),

		// Ratings
		tmdbRating: num(movie.tmdbRating),
		tmdbVoteCount: num(movie.tmdbVoteCount),

		// Financials
		budget: num(movie.budget),
		revenue: num(movie.revenue),

		// Images
		poster: poster(posterPath),
		backdrop: backdrop(backdropPath),

		// Production info
		productionCompanies: arr(movie.productionCompanies),
		spokenLanguages: arr(movie.spokenLanguages),
		collection: str(movie.collection),

		// Credits
		cast: arr(movie.cast),
		characters: arr(movie.characters),
		directors: arr(movie.directors),

		// Special helper
		castWithRoles: new CastWithRolesHelper(movie.cast, movie.characters),
	};
}

/**
 * Extracts the image path from a full TMDB URL
 * @param url - Full URL like "https://image.tmdb.org/t/p/original/abc123.jpg"
 * @returns Path like "/abc123.jpg" or empty string if no URL
 */
function extractImagePath(url: string): string {
	if (!url) return "";
	// Match the path after the size segment (e.g., /original, /w500)
	const match = url.match(/\/t\/p\/[^/]+(\/.+)$/);
	return match ? match[1] : "";
}

/**
 * Renders a template with the given TMDB movie data
 * @param template - Eta template string with <%= it.variable %> syntax
 * @param movie - TMDB movie data
 * @returns Rendered template string
 */
export function renderTMDBTemplate(template: string, movie: TMDBMovie): string {
	const data = wrapTMDBMovie(movie);
	return etaRender(template, data);
}

/**
 * Generates a filename from the template and movie data
 * @param filenameTemplate - Eta filename template with <%= it.variable %> syntax
 * @param movie - TMDB movie data
 * @returns Safe filename (without .md extension)
 */
export function generateTMDBFilename(filenameTemplate: string, movie: TMDBMovie): string {
	const data = wrapTMDBMovie(movie);
	return etaGenerateFilename(filenameTemplate, data);
}
