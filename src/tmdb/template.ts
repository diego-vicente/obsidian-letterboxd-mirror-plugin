import type { TMDBMovie } from "./types";
import {
	renderTemplate as etaRender,
	generateFilename as etaGenerateFilename,
} from "../eta/engine";
import { str, arr, num, bool, FluentArray } from "../eta/fluent";

/**
 * Wrapped TMDB movie data for Eta templates
 * All properties are fluent wrappers enabling chainable methods
 */
interface WrappedTMDBMovie {
	// Core identifiers
	tmdbId: ReturnType<typeof num>;
	imdbId: ReturnType<typeof str>;
	tmdbUrl: ReturnType<typeof str>;

	// Titles
	title: ReturnType<typeof str>;
	originalTitle: ReturnType<typeof str>;
	originalLanguage: ReturnType<typeof str>;

	// Dates and timing
	year: ReturnType<typeof num>;
	releaseDate: ReturnType<typeof str>;
	runtime: ReturnType<typeof num>;
	runtimeFormatted: ReturnType<typeof str>;

	// Content
	overview: ReturnType<typeof str>;
	tagline: ReturnType<typeof str>;

	// Genres
	genres: ReturnType<typeof arr>;
	genreList: ReturnType<typeof str>;

	// Ratings
	tmdbRating: ReturnType<typeof num>;
	tmdbVoteCount: ReturnType<typeof num>;

	// Financials
	budget: ReturnType<typeof num>;
	revenue: ReturnType<typeof num>;

	// Poster URLs
	posterUrlXXS: ReturnType<typeof str>;
	posterUrlXS: ReturnType<typeof str>;
	posterUrlS: ReturnType<typeof str>;
	posterUrlM: ReturnType<typeof str>;
	posterUrlL: ReturnType<typeof str>;
	posterUrlXL: ReturnType<typeof str>;
	posterUrlOG: ReturnType<typeof str>;

	// Backdrop URLs
	backdropUrlS: ReturnType<typeof str>;
	backdropUrlM: ReturnType<typeof str>;
	backdropUrlL: ReturnType<typeof str>;
	backdropUrlOG: ReturnType<typeof str>;

	// Production info
	productionCompanies: ReturnType<typeof arr>;
	productionCompanyList: ReturnType<typeof str>;
	spokenLanguages: ReturnType<typeof arr>;
	spokenLanguageList: ReturnType<typeof str>;
	collection: ReturnType<typeof str>;

	// Credits
	cast: ReturnType<typeof arr>;
	characters: ReturnType<typeof arr>;
	directors: ReturnType<typeof arr>;

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

	/** Format as YAML bullet list */
	yamlBullet(): string {
		return this.buildRoles()
			.map((role) => `  - ${role}`)
			.join("\n");
	}
}

/**
 * Transforms a TMDBMovie into wrapped data for Eta templates
 */
function wrapTMDBMovie(movie: TMDBMovie): WrappedTMDBMovie {
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
		genreList: str(movie.genreList),

		// Ratings
		tmdbRating: num(movie.tmdbRating),
		tmdbVoteCount: num(movie.tmdbVoteCount),

		// Financials
		budget: num(movie.budget),
		revenue: num(movie.revenue),

		// Poster URLs
		posterUrlXXS: str(movie.posterUrlXXS),
		posterUrlXS: str(movie.posterUrlXS),
		posterUrlS: str(movie.posterUrlS),
		posterUrlM: str(movie.posterUrlM),
		posterUrlL: str(movie.posterUrlL),
		posterUrlXL: str(movie.posterUrlXL),
		posterUrlOG: str(movie.posterUrlOG),

		// Backdrop URLs
		backdropUrlS: str(movie.backdropUrlS),
		backdropUrlM: str(movie.backdropUrlM),
		backdropUrlL: str(movie.backdropUrlL),
		backdropUrlOG: str(movie.backdropUrlOG),

		// Production info
		productionCompanies: arr(movie.productionCompanies),
		productionCompanyList: str(movie.productionCompanyList),
		spokenLanguages: arr(movie.spokenLanguages),
		spokenLanguageList: str(movie.spokenLanguageList),
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
