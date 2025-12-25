/** Sentinel value for tags when imported from RSS (which doesn't include tags) */
export const TAGS_PENDING_FROM_RSS = "_pending_csv_import";

/**
 * Notification verbosity levels for sync operations
 * - silent: No notifications during sync
 * - verbose: All messages (start, complete, errors, counts)
 * - newFilesOnly: Only notify when new files are created (count > 0)
 */
export type NotificationLevel = "silent" | "verbose" | "newFilesOnly";

/**
 * Represents a single diary entry from Letterboxd RSS feed or CSV import
 */
export interface LetterboxdEntry {
	/** Clean film title without year */
	filmTitle: string;
	/** Film release year */
	filmYear: number;
	/** Numeric rating 1-5 (supports half stars like 3.5), null if unrated */
	userRatingNo: number | null;
	/** Star representation of rating (e.g., "★★★½"), empty string if unrated */
	userRatingStars: string;
	/** Date the film was watched (YYYY-MM-DD format) */
	watchedDate: string;
	/** Whether this is a rewatch */
	rewatch: boolean;
	/** Permalink to the Letterboxd review/log */
	link: string;
	/** TheMovieDB ID for additional metadata lookups */
	tmdbId: string;
	/** URL to the film poster image */
	posterUrl: string;
	/** Unique identifier for this diary entry (letterboxd-review-* or letterboxd-watch-*) */
	guid: string;
	/** User's review text, empty string if no review */
	review: string;
	/** Date the entry was published/logged on Letterboxd (YYYY-MM-DD format) */
	pubDate: string;
	/** Whether the review contains spoilers */
	containsSpoilers: boolean;
	/** Tags from Letterboxd (only available via CSV import, sentinel value from RSS) */
	tags: string[];
}

/**
 * Plugin settings persisted to data.json
 */
export interface LetterboxdSettings {
	/** Letterboxd username (used to construct RSS feed URL) */
	username: string;
	/** Folder path within vault where diary notes will be created */
	folderPath: string;
	/** Template for note filenames, supports {{variables}} */
	filenameTemplate: string;
	/** Template for note content, supports {{variables}} and {{#if}}...{{/if}} */
	noteTemplate: string;
	/** Whether to sync automatically when Obsidian starts */
	syncOnStartup: boolean;
	/** Only sync entries that have a review (skip watch-only logs) */
	syncReviewsOnly: boolean;
	/** Notification verbosity level for sync operations */
	notificationLevel: NotificationLevel;
	/** Frontmatter key used to store the Letterboxd GUID for deduplication */
	guidFrontmatterKey: string;

	// ============================================================================
	// TMDB Settings
	// ============================================================================

	/** TMDB API Read Access Token (Bearer token) - enables TMDB features when set */
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
