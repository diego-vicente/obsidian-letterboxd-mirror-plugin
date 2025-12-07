import { App, PluginSettingTab, Setting } from "obsidian";
import type LetterboxdPlugin from "./main";
import type { LetterboxdSettings } from "./types";

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

	constructor(app: App, plugin: LetterboxdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Letterboxd Mirror" });

		// Network disclosure
		const disclosureEl = containerEl.createEl("p", {
			cls: "setting-item-description",
		});
		disclosureEl.innerHTML = `This plugin fetches data from <code>letterboxd.com/&lt;username&gt;/rss</code> to sync your diary entries.`;

		new Setting(containerEl)
			.setName("Letterboxd username")
			.setDesc("Your Letterboxd username (e.g., 'vicente35mm')")
			.addText((text) =>
				text
					.setPlaceholder("username")
					.setValue(this.plugin.settings.username)
					.onChange(async (value) => {
						this.plugin.settings.username = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Folder path")
			.setDesc("Folder where diary notes will be created")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_FOLDER_PATH)
					.setValue(this.plugin.settings.folderPath)
					.onChange(async (value) => {
						this.plugin.settings.folderPath = value.trim() || DEFAULT_FOLDER_PATH;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Filename template")
			.setDesc("Template for note filenames. Available: {{filmTitle}}, {{filmYear}}, {{watchedDate}}, {{tmdbId}}")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_FILENAME_TEMPLATE)
					.setValue(this.plugin.settings.filenameTemplate)
					.onChange(async (value) => {
						this.plugin.settings.filenameTemplate = value.trim() || DEFAULT_FILENAME_TEMPLATE;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sync on startup")
			.setDesc("Automatically sync diary entries when Obsidian starts")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.syncOnStartup)
					.onChange(async (value) => {
						this.plugin.settings.syncOnStartup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Reviews only")
			.setDesc("Only sync entries that have a review (skip watch-only logs)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.syncReviewsOnly)
					.onChange(async (value) => {
						this.plugin.settings.syncReviewsOnly = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("GUID frontmatter key")
			.setDesc("Frontmatter attribute used to store the Letterboxd entry ID (for deduplication)")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_GUID_KEY)
					.setValue(this.plugin.settings.guidFrontmatterKey)
					.onChange(async (value) => {
						this.plugin.settings.guidFrontmatterKey = value.trim() || DEFAULT_GUID_KEY;
						await this.plugin.saveSettings();
					})
			);

		// Note template (textarea)
		new Setting(containerEl)
			.setName("Note template")
			.setDesc("Template for note content. Available variables: {{filmTitle}}, {{filmYear}}, {{userRatingNoOver5}}, {{userRatingNoOver10}}, {{userRatingStars}}, {{watchedDate}}, {{watchedDatetime}}, {{rewatch}}, {{link}}, {{tmdbId}}, {{posterUrl}}, {{guid}}, {{review}}, {{pubDate}}, {{containsSpoilers}}, {{tags}}. Conditionals: {{#if rewatch}}...{{/if}}")
			.addTextArea((text) => {
				text
					.setPlaceholder(DEFAULT_NOTE_TEMPLATE)
					.setValue(this.plugin.settings.noteTemplate)
					.onChange(async (value) => {
						this.plugin.settings.noteTemplate = value || DEFAULT_NOTE_TEMPLATE;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 20;
				text.inputEl.cols = 60;
			});

		// Reset template button
		new Setting(containerEl)
			.setName("Reset template")
			.setDesc("Reset the note template to default")
			.addButton((button) =>
				button
					.setButtonText("Reset")
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.noteTemplate = DEFAULT_NOTE_TEMPLATE;
						await this.plugin.saveSettings();
						this.display(); // Re-render to show updated value
					})
			);

		// ============================================================================
		// TMDB Settings Section
		// ============================================================================

		containerEl.createEl("h2", { text: "TMDB Integration" });

		const tmdbDisclosureEl = containerEl.createEl("p", {
			cls: "setting-item-description",
		});
		tmdbDisclosureEl.innerHTML = `When a TMDB API key is provided, the plugin will create Film notes with enriched metadata from <a href="https://www.themoviedb.org/">The Movie Database</a>. Get your API key from <a href="https://www.themoviedb.org/settings/api">TMDB Settings</a>.`;

		new Setting(containerEl)
			.setName("TMDB API Read Access Token")
			.setDesc("Your TMDB API Read Access Token (not the API key)")
			.addText((text) =>
				text
					.setPlaceholder("Enter your TMDB API key")
					.setValue(this.plugin.settings.tmdbApiKey)
					.onChange(async (value) => {
						this.plugin.settings.tmdbApiKey = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Films folder path")
			.setDesc("Folder where Film notes will be created")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TMDB_FOLDER_PATH)
					.setValue(this.plugin.settings.tmdbFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.tmdbFolderPath = value.trim() || DEFAULT_TMDB_FOLDER_PATH;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Film filename template")
			.setDesc("Template for Film note filenames. Available: {{title}}, {{originalTitle}}, {{year}}, {{tmdbId}}, {{imdbId}}")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TMDB_FILENAME_TEMPLATE)
					.setValue(this.plugin.settings.tmdbFilenameTemplate)
					.onChange(async (value) => {
						this.plugin.settings.tmdbFilenameTemplate = value.trim() || DEFAULT_TMDB_FILENAME_TEMPLATE;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("TMDB language")
			.setDesc("Preferred language for TMDB data (e.g., 'en-US', 'es-ES', 'fr-FR')")
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_TMDB_LANGUAGE)
					.setValue(this.plugin.settings.tmdbLanguage)
					.onChange(async (value) => {
						this.plugin.settings.tmdbLanguage = value.trim() || DEFAULT_TMDB_LANGUAGE;
						await this.plugin.saveSettings();
					})
			);

		// Film note template (textarea)
		new Setting(containerEl)
			.setName("Film note template")
			.setDesc("Template for Film note content. Available: {{title}}, {{originalTitle}}, {{year}}, {{releaseDate}}, {{runtime}}, {{runtimeFormatted}}, {{overview}}, {{tagline}}, {{genres}}, {{genreList}}, {{tmdbRating}}, {{tmdbVoteCount}}, {{budget}}, {{revenue}}, {{imdbId}}, {{tmdbId}}, {{tmdbUrl}}, {{posterUrlXXS/XS/S/M/L/XL/OG}}, {{backdropUrlS/M/L/OG}}, {{productionCompanies}}, {{productionCompanyList}}, {{spokenLanguages}}, {{spokenLanguageList}}, {{collection}}. Conditionals: {{#if tagline}}...{{/if}}")
			.addTextArea((text) => {
				text
					.setPlaceholder(DEFAULT_TMDB_NOTE_TEMPLATE)
					.setValue(this.plugin.settings.tmdbNoteTemplate)
					.onChange(async (value) => {
						this.plugin.settings.tmdbNoteTemplate = value || DEFAULT_TMDB_NOTE_TEMPLATE;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 20;
				text.inputEl.cols = 60;
			});

		// Reset TMDB template button
		new Setting(containerEl)
			.setName("Reset Film template")
			.setDesc("Reset the Film note template to default")
			.addButton((button) =>
				button
					.setButtonText("Reset")
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.tmdbNoteTemplate = DEFAULT_TMDB_NOTE_TEMPLATE;
						await this.plugin.saveSettings();
						this.display(); // Re-render to show updated value
					})
			);
	}
}
