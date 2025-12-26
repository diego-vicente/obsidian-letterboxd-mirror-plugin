import { App, normalizePath, PluginSettingTab, Setting, debounce } from "obsidian";
import type LetterboxdPlugin from "./main";
import type { LetterboxdSettings, NotificationLevel } from "./types";
import { TemplateEditorModal } from "./ui/template-editor-modal";

/** Debounce delay for saving settings (ms) */
const SETTINGS_SAVE_DEBOUNCE_MS = 500;

/** Default note template - loaded from templates/default-note.md at build time */
const DEFAULT_NOTE_TEMPLATE = `---
film: "[[{{filmTitle}} ({{filmYear}})]]"
rating: {{userRatingNoOver10}}
watched_date: {{watchedDate}}
letterboxd_url: {{link yaml=true}}
tmdb_id: {{tmdbId}}
poster: {{posterUrl yaml=true}}
letterboxd_guid: {{guid}}
letterboxd_tags: {{tags yaml=true}}
---

# [[{{filmTitle}} ({{filmYear}})]]

{{posterUrl skipEmpty=true prefix="![Poster](" suffix=")"}}

**Rating**: {{userRatingStars}}
**Watched**: {{watchedDate}}{{#if rewatch}} (rewatch){{/if}}

{{review skipEmpty=true quote=true}}

---
[View on Letterboxd]({{link}})
`;

/** Default filename template */
const DEFAULT_FILENAME_TEMPLATE = "{{watchedDate}} - {{filmTitle}}";

/** Default folder for diary notes */
const DEFAULT_FOLDER_PATH = "Letterboxd";

/** Default frontmatter key for GUID */
const DEFAULT_GUID_KEY = "letterboxd_guid";

/** Default notification level */
const DEFAULT_NOTIFICATION_LEVEL: NotificationLevel = "verbose";

/**
 * Notification level options for dropdown
 * Maps display name to NotificationLevel value
 */
const NOTIFICATION_LEVELS: Record<string, NotificationLevel> = {
	Silent: "silent",
	Verbose: "verbose",
	"New files only": "newFilesOnly",
};

// ============================================================================
// TMDB Defaults
// ============================================================================

/** Default folder for Film notes */
const DEFAULT_TMDB_FOLDER_PATH = "Films";

/** Default filename template for Film notes */
const DEFAULT_TMDB_FILENAME_TEMPLATE = "{{title}} ({{year}})";

/** Default frontmatter key for TMDB ID */
const DEFAULT_TMDB_ID_KEY = "tmdb_id";

/** Default language for TMDB API */
const DEFAULT_TMDB_LANGUAGE = "en-US";

/**
 * Supported languages for TMDB API
 * Maps display name to TMDB language code (ISO 639-1 + ISO 3166-1)
 */
const TMDB_LANGUAGES: Record<string, string> = {
	"English (US)": "en-US",
	"English (UK)": "en-GB",
	"Spanish (Spain)": "es-ES",
	"Spanish (Mexico)": "es-MX",
	"French (France)": "fr-FR",
	"French (Canada)": "fr-CA",
	German: "de-DE",
	Italian: "it-IT",
	"Portuguese (Brazil)": "pt-BR",
	"Portuguese (Portugal)": "pt-PT",
	Dutch: "nl-NL",
	Polish: "pl-PL",
	Russian: "ru-RU",
	Japanese: "ja-JP",
	Korean: "ko-KR",
	"Chinese (Simplified)": "zh-CN",
	"Chinese (Traditional)": "zh-TW",
	Turkish: "tr-TR",
	Swedish: "sv-SE",
	Norwegian: "no-NO",
	Danish: "da-DK",
	Finnish: "fi-FI",
	Czech: "cs-CZ",
	Hungarian: "hu-HU",
	Romanian: "ro-RO",
	Greek: "el-GR",
	Hebrew: "he-IL",
	Arabic: "ar-SA",
	Thai: "th-TH",
	Vietnamese: "vi-VN",
	Indonesian: "id-ID",
	Malay: "ms-MY",
	Hindi: "hi-IN",
	Ukrainian: "uk-UA",
	Croatian: "hr-HR",
	Bulgarian: "bg-BG",
	Slovak: "sk-SK",
	Slovenian: "sl-SI",
	Serbian: "sr-RS",
	Catalan: "ca-ES",
	Basque: "eu-ES",
	Galician: "gl-ES",
};

/** Default note template for Film notes */
const DEFAULT_TMDB_NOTE_TEMPLATE = `---
title: "{{title}}"
original_title: "{{originalTitle}}"
year: {{year}}
release_date: {{releaseDate}}
runtime: {{runtime}}
tmdb_id: {{tmdbId}}
imdb_id: "{{imdbId}}"
tmdb_rating: {{tmdbRating}}
genres: {{genres yaml=true}}
directors: {{directors yaml=true link=true}}
cast: {{cast yaml=true link=true}}
poster: "{{posterUrlL}}"
---

# {{title}} ({{year}})

{{posterUrlL skipEmpty=true prefix="![Poster](" suffix=")"}}

{{tagline quote=true bold=true}}
{{overview quote=true}}

**Runtime**: {{runtimeFormatted}}
**Genres**: {{genreList}}

## Cast

{{castWithRoles bullet=true linkActors=true}}

---
[TMDB]({{tmdbUrl}}){{#if imdbId}} | [IMDb](https://imdb.com/title/{{imdbId}}){{/if}}
`;

export const DEFAULT_SETTINGS: LetterboxdSettings = {
	// Letterboxd settings
	username: "",
	folderPath: DEFAULT_FOLDER_PATH,
	filenameTemplate: DEFAULT_FILENAME_TEMPLATE,
	noteTemplate: DEFAULT_NOTE_TEMPLATE,
	syncOnStartup: true,
	syncReviewsOnly: false,
	notificationLevel: DEFAULT_NOTIFICATION_LEVEL,
	guidFrontmatterKey: DEFAULT_GUID_KEY,
	// TMDB settings
	tmdbApiKey: "",
	tmdbFolderPath: DEFAULT_TMDB_FOLDER_PATH,
	tmdbFilenameTemplate: DEFAULT_TMDB_FILENAME_TEMPLATE,
	tmdbNoteTemplate: DEFAULT_TMDB_NOTE_TEMPLATE,
	tmdbLanguage: DEFAULT_TMDB_LANGUAGE,
	tmdbIdFrontmatterKey: DEFAULT_TMDB_ID_KEY,
};

export class LetterboxdSettingTab extends PluginSettingTab {
	plugin: LetterboxdPlugin;
	private debouncedSave: () => void;

	constructor(app: App, plugin: LetterboxdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		// Create debounced save function to avoid excessive disk writes on each keystroke
		this.debouncedSave = debounce(
			() => this.plugin.saveSettings(),
			SETTINGS_SAVE_DEBOUNCE_MS,
			true
		);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Network disclosure - using Setting for consistent styling
		const networkDesc = document.createDocumentFragment();
		networkDesc.appendText("This plugin fetches data from ");
		networkDesc.createEl("code", { text: "letterboxd.com/<username>/rss" });
		networkDesc.appendText(" to sync your diary entries.");

		new Setting(containerEl).setDesc(networkDesc);

		// ============================================================================
		// General settings (no heading per Obsidian guidelines)
		// ============================================================================

		new Setting(containerEl)
			.setName("Letterboxd username")
			.setDesc("Your Letterboxd username")
			.addText((text) =>
				text
					.setPlaceholder("Username")
					.setValue(this.plugin.settings.username)
					.onChange((value) => {
						this.plugin.settings.username = value.trim();
						this.debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Diary folder")
			.setDesc("Folder where diary notes will be created")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_FOLDER_PATH)
					.setValue(this.plugin.settings.folderPath)
					.onChange((value) => {
						this.plugin.settings.folderPath = normalizePath(
							value.trim() || DEFAULT_FOLDER_PATH
						);
						this.debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Sync on startup")
			.setDesc("Automatically sync diary entries when Obsidian starts")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.syncOnStartup).onChange((value) => {
					this.plugin.settings.syncOnStartup = value;
					this.debouncedSave();
				})
			);

		new Setting(containerEl)
			.setName("Reviews only")
			.setDesc("Only sync entries that have a review (skip watch-only logs)")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.syncReviewsOnly).onChange((value) => {
					this.plugin.settings.syncReviewsOnly = value;
					this.debouncedSave();
				})
			);

		new Setting(containerEl)
			.setName("Notifications")
			.setDesc("Control when sync notifications are shown")
			.addDropdown((dropdown) => {
				for (const [displayName, value] of Object.entries(NOTIFICATION_LEVELS)) {
					dropdown.addOption(value, displayName);
				}
				dropdown
					.setValue(this.plugin.settings.notificationLevel)
					.onChange((value: NotificationLevel) => {
						this.plugin.settings.notificationLevel = value;
						this.debouncedSave();
					});
			});

		// ============================================================================
		// Diary templates section
		// ============================================================================

		new Setting(containerEl).setName("Diary templates").setHeading();

		new Setting(containerEl)
			.setName("Filename template")
			.setDesc(
				createDescWithVariables("Available: ", [
					"{{filmTitle}}",
					"{{filmYear}}",
					"{{watchedDate}}",
					"{{tmdbId}}",
				])
			)
			.addText((text) => {
				text.setPlaceholder(DEFAULT_FILENAME_TEMPLATE)
					.setValue(this.plugin.settings.filenameTemplate)
					.onChange((value) => {
						this.plugin.settings.filenameTemplate =
							value.trim() || DEFAULT_FILENAME_TEMPLATE;
						this.debouncedSave();
					});
				text.inputEl.addClass("letterboxd-monospace-input");
			});

		// Diary note template - button to open modal
		new Setting(containerEl)
			.setName("Note template")
			.setDesc("Template for diary note content")
			.addButton((button) =>
				button.setButtonText("Edit template").onClick(() => {
					new TemplateEditorModal(this.app, {
						title: "Edit diary note template",
						template: this.plugin.settings.noteTemplate,
						defaultTemplate: DEFAULT_NOTE_TEMPLATE,
						onSave: (template) => {
							this.plugin.settings.noteTemplate = template;
							void this.plugin.saveSettings();
						},
					}).open();
				})
			);

		// ============================================================================
		// TMDB integration section
		// ============================================================================

		new Setting(containerEl).setName("TMDB integration").setHeading();

		// TMDB disclosure - using safe DOM methods
		const tmdbDesc = document.createDocumentFragment();
		tmdbDesc.appendText("Create film notes with enriched metadata from ");
		tmdbDesc.createEl("a", {
			text: "The Movie Database",
			href: "https://www.themoviedb.org/",
		});
		tmdbDesc.appendText(".");

		new Setting(containerEl).setDesc(tmdbDesc);

		new Setting(containerEl)
			.setName("API read access token")
			.setDesc(
				createDescWithLink(
					"Get your token from ",
					"TMDB API settings",
					"https://www.themoviedb.org/settings/api"
				)
			)
			.addText((text) => {
				text.setPlaceholder("Enter your TMDB API token")
					.setValue(this.plugin.settings.tmdbApiKey)
					.onChange((value) => {
						this.plugin.settings.tmdbApiKey = value.trim();
						this.debouncedSave();
					});
				text.inputEl.addClass("letterboxd-monospace-input");
			});

		new Setting(containerEl)
			.setName("Film folder")
			.setDesc("Folder where film notes will be created")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TMDB_FOLDER_PATH)
					.setValue(this.plugin.settings.tmdbFolderPath)
					.onChange((value) => {
						this.plugin.settings.tmdbFolderPath = normalizePath(
							value.trim() || DEFAULT_TMDB_FOLDER_PATH
						);
						this.debouncedSave();
					})
			);

		new Setting(containerEl)
			.setName("Language")
			.setDesc("Preferred language for TMDB data")
			.addDropdown((dropdown) => {
				// Add all language options
				for (const [displayName, code] of Object.entries(TMDB_LANGUAGES)) {
					dropdown.addOption(code, displayName);
				}
				dropdown.setValue(this.plugin.settings.tmdbLanguage).onChange((value) => {
					this.plugin.settings.tmdbLanguage = value;
					this.debouncedSave();
				});
			});

		new Setting(containerEl)
			.setName("Film filename template")
			.setDesc(
				createDescWithVariables("Available: ", [
					"{{title}}",
					"{{originalTitle}}",
					"{{year}}",
					"{{tmdbId}}",
					"{{imdbId}}",
				])
			)
			.addText((text) => {
				text.setPlaceholder(DEFAULT_TMDB_FILENAME_TEMPLATE)
					.setValue(this.plugin.settings.tmdbFilenameTemplate)
					.onChange((value) => {
						this.plugin.settings.tmdbFilenameTemplate =
							value.trim() || DEFAULT_TMDB_FILENAME_TEMPLATE;
						this.debouncedSave();
					});
				text.inputEl.addClass("letterboxd-monospace-input");
			});

		// Film note template - button to open modal
		new Setting(containerEl)
			.setName("Film note template")
			.setDesc("Template for film note content")
			.addButton((button) =>
				button.setButtonText("Edit template").onClick(() => {
					new TemplateEditorModal(this.app, {
						title: "Edit film note template",
						template: this.plugin.settings.tmdbNoteTemplate,
						defaultTemplate: DEFAULT_TMDB_NOTE_TEMPLATE,
						onSave: (template) => {
							this.plugin.settings.tmdbNoteTemplate = template;
							void this.plugin.saveSettings();
						},
					}).open();
				})
			);

		// ============================================================================
		// Advanced section
		// ============================================================================

		new Setting(containerEl).setName("Advanced").setHeading();

		const guidKeyDesc = document.createDocumentFragment();
		guidKeyDesc.appendText("Frontmatter key for Letterboxd entry ID. Default: ");
		guidKeyDesc.createEl("code", { text: DEFAULT_GUID_KEY });

		new Setting(containerEl)
			.setName("Diary GUID frontmatter key")
			.setDesc(guidKeyDesc)
			.addText((text) => {
				text.setPlaceholder(DEFAULT_GUID_KEY)
					.setValue(this.plugin.settings.guidFrontmatterKey)
					.onChange((value) => {
						this.plugin.settings.guidFrontmatterKey = value.trim() || DEFAULT_GUID_KEY;
						this.debouncedSave();
					});
				text.inputEl.addClass("letterboxd-monospace-input");
			});

		const tmdbKeyDesc = document.createDocumentFragment();
		tmdbKeyDesc.appendText("Frontmatter key for TMDB ID. Default: ");
		tmdbKeyDesc.createEl("code", { text: DEFAULT_TMDB_ID_KEY });

		new Setting(containerEl)
			.setName("Film TMDB ID frontmatter key")
			.setDesc(tmdbKeyDesc)
			.addText((text) => {
				text.setPlaceholder(DEFAULT_TMDB_ID_KEY)
					.setValue(this.plugin.settings.tmdbIdFrontmatterKey)
					.onChange((value) => {
						this.plugin.settings.tmdbIdFrontmatterKey =
							value.trim() || DEFAULT_TMDB_ID_KEY;
						this.debouncedSave();
					});
				text.inputEl.addClass("letterboxd-monospace-input");
			});
	}
}

/**
 * Creates a description fragment with a link
 */
function createDescWithLink(prefix: string, linkText: string, url: string): DocumentFragment {
	const desc = document.createDocumentFragment();
	desc.appendText(prefix);
	desc.createEl("a", { text: linkText, href: url });
	desc.appendText(".");
	return desc;
}

/**
 * Creates a description with code-formatted variables
 * @param prefix - Text before the variables
 * @param variables - Array of variable names (will be wrapped in code tags)
 */
function createDescWithVariables(prefix: string, variables: string[]): DocumentFragment {
	const desc = document.createDocumentFragment();
	desc.appendText(prefix);
	variables.forEach((variable, index) => {
		desc.createEl("code", { text: variable });
		if (index < variables.length - 1) {
			desc.appendText(", ");
		}
	});
	return desc;
}
