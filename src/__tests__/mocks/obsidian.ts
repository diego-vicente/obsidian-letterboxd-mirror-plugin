/**
 * Mock Obsidian API for unit tests
 */

export class Notice {
	constructor(
		public message: string,
		public timeout?: number
	) {}
}

export class TFile {
	basename: string;
	extension: string;
	path: string;

	constructor(path: string) {
		this.path = path;
		this.extension = path.split(".").pop() || "";
		this.basename = path.split("/").pop()?.replace(`.${this.extension}`, "") || "";
	}
}

export class TFolder {
	path: string;
	children: (TFile | TFolder)[] = [];

	constructor(path: string) {
		this.path = path;
	}
}

export interface RequestUrlParam {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
}

export interface RequestUrlResponse {
	status: number;
	text: string;
	json: unknown;
}

export async function requestUrl(params: RequestUrlParam): Promise<RequestUrlResponse> {
	// This will be mocked in tests that need it
	throw new Error(`requestUrl not mocked for: ${params.url}`);
}

export class Plugin {
	app: unknown;
	manifest: unknown;

	loadData(): Promise<unknown> {
		return Promise.resolve({});
	}

	saveData(_data: unknown): Promise<void> {
		return Promise.resolve();
	}

	addCommand(_command: unknown): void {}
	addRibbonIcon(_icon: string, _title: string, _callback: () => void): void {}
	addSettingTab(_tab: unknown): void {}
	registerInterval(_id: number): void {}
}

export class PluginSettingTab {
	app: unknown;
	plugin: unknown;
	containerEl: HTMLElement;

	constructor(app: unknown, plugin: unknown) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement("div");
	}

	display(): void {}
	hide(): void {}
}

export class Setting {
	constructor(_containerEl: HTMLElement) {}
	setName(_name: string): this {
		return this;
	}
	setDesc(_desc: string): this {
		return this;
	}
	addText(_cb: (text: TextComponent) => void): this {
		return this;
	}
	addToggle(_cb: (toggle: ToggleComponent) => void): this {
		return this;
	}
	addTextArea(_cb: (textarea: TextAreaComponent) => void): this {
		return this;
	}
}

export class TextComponent {
	setValue(_value: string): this {
		return this;
	}
	setPlaceholder(_placeholder: string): this {
		return this;
	}
	onChange(_cb: (value: string) => void): this {
		return this;
	}
}

export class ToggleComponent {
	setValue(_value: boolean): this {
		return this;
	}
	onChange(_cb: (value: boolean) => void): this {
		return this;
	}
}

export class TextAreaComponent {
	setValue(_value: string): this {
		return this;
	}
	setPlaceholder(_placeholder: string): this {
		return this;
	}
	onChange(_cb: (value: string) => void): this {
		return this;
	}
}
