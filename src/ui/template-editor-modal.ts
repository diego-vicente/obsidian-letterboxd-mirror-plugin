/**
 * Template Editor Modal
 *
 * A modal for editing templates with a large, monospaced textarea
 */

import { App, Modal, Setting } from "obsidian";

/** Callback when template is saved */
type OnSaveCallback = (template: string) => void;

// TODO: Create documentation page for template variables and update this URL
const TEMPLATE_DOCS_URL = "https://github.com/your-repo/obsidian-letterboxd-plugin#templates";

/**
 * Modal for editing template content with a monospaced editor
 */
export class TemplateEditorModal extends Modal {
	private template: string;
	private defaultTemplate: string;
	private onSave: OnSaveCallback;
	private modalTitle: string;

	constructor(
		app: App,
		options: {
			title: string;
			template: string;
			defaultTemplate: string;
			onSave: OnSaveCallback;
		}
	) {
		super(app);
		this.modalTitle = options.title;
		this.template = options.template;
		this.defaultTemplate = options.defaultTemplate;
		this.onSave = options.onSave;
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		contentEl.empty();
		modalEl.addClass("mod-letterboxd-template-editor");

		// Title
		this.setTitle(this.modalTitle);

		// Short description with link to docs
		const descEl = contentEl.createEl("p", {
			cls: "letterboxd-template-description setting-item-description",
		});
		descEl.appendText("Use ");
		descEl.createEl("code", { text: "{{variables}}" });
		descEl.appendText(" for dynamic content. ");
		descEl.createEl("a", {
			text: "View documentation",
			href: TEMPLATE_DOCS_URL,
		});

		// Template textarea
		const textareaContainer = contentEl.createDiv({
			cls: "letterboxd-template-textarea-container",
		});

		const textarea = textareaContainer.createEl("textarea", {
			cls: "letterboxd-template-textarea",
		});
		textarea.value = this.template;
		textarea.spellcheck = false;
		textarea.addEventListener("input", () => {
			this.template = textarea.value;
		});

		// Buttons row
		const buttonContainer = contentEl.createDiv({
			cls: "letterboxd-template-buttons",
		});

		new Setting(buttonContainer)
			.addButton((btn) =>
				btn
					.setButtonText("Reset to default")
					.setWarning()
					.onClick(() => {
						textarea.value = this.defaultTemplate;
						this.template = this.defaultTemplate;
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Save")
					.setCta()
					.onClick(() => {
						this.onSave(this.template);
						this.close();
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
