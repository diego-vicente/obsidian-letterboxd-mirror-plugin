import { App, PluginSettingTab, Setting } from "obsidian";
import type LetterboxdPlugin from "./main";
import type { LetterboxdSettings } from "./types";

/** Default note template - loaded from templates/default-note.md at build time */
const DEFAULT_NOTE_TEMPLATE = `---
film: "[[{{filmTitle}}]]"
rating: {{userRatingNoOver5}}
watched_date: {{watchedDate}}
letterboxd_url: "{{link}}"
tmdb_id: {{tmdbId}}
poster: "{{posterUrl}}"
letterboxd_guid: {{guid}}
letterboxd_tags: {{tags}}
---

# [[{{filmTitle}}]] ({{filmYear}})

![]({{posterUrl}})

**Rating**: {{userRatingStars}}
**Watched**: {{watchedDate}}{{#if rewatch}} (rewatch){{/if}}

> {{review}}

---
[View on Letterboxd]({{link}})
`;

/** Default filename template */
const DEFAULT_FILENAME_TEMPLATE = "{{watchedDate}} - {{filmTitle}}";

/** Default folder for diary notes */
const DEFAULT_FOLDER_PATH = "Letterboxd";

/** Default frontmatter key for GUID */
const DEFAULT_GUID_KEY = "letterboxd_guid";

export const DEFAULT_SETTINGS: LetterboxdSettings = {
	username: "",
	folderPath: DEFAULT_FOLDER_PATH,
	filenameTemplate: DEFAULT_FILENAME_TEMPLATE,
	noteTemplate: DEFAULT_NOTE_TEMPLATE,
	syncOnStartup: true,
	syncReviewsOnly: false,
	guidFrontmatterKey: DEFAULT_GUID_KEY,
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
	}
}
