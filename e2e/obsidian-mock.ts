/**
 * Obsidian Mock for E2E Tests
 *
 * This mock replaces the `obsidian` module in E2E tests.
 * Unlike the unit test mock, this one uses real HTTP via Node's fetch API.
 * This allows us to test the actual parsing logic with real network calls.
 */

// ============================================================================
// Types (matching Obsidian's API)
// ============================================================================

export interface RequestUrlParam {
	url: string;
	method?: string;
	contentType?: string;
	body?: string | ArrayBuffer;
	headers?: Record<string, string>;
	throw?: boolean;
}

export interface RequestUrlResponse {
	status: number;
	headers: Record<string, string>;
	arrayBuffer: ArrayBuffer;
	json: unknown;
	text: string;
}

// ============================================================================
// requestUrl - Real HTTP implementation
// ============================================================================

/**
 * Mock implementation of Obsidian's requestUrl using Node's fetch.
 * This allows E2E tests to use the actual source code with real HTTP requests.
 */
export async function requestUrl(request: RequestUrlParam | string): Promise<RequestUrlResponse> {
	const params: RequestUrlParam = typeof request === "string" ? { url: request } : request;

	const fetchHeaders: Record<string, string> = {
		"User-Agent": "Mozilla/5.0 (compatible; LetterboxdMirror-E2E/1.0)",
		...params.headers,
	};

	if (params.contentType) {
		fetchHeaders["Content-Type"] = params.contentType;
	}

	const fetchOptions: RequestInit = {
		method: params.method || "GET",
		headers: fetchHeaders,
	};

	if (params.body) {
		fetchOptions.body =
			params.body instanceof ArrayBuffer ? Buffer.from(params.body) : params.body;
	}

	const response = await fetch(params.url, fetchOptions);
	const text = await response.text();

	// Convert headers to plain object
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});

	// Try to parse JSON, fall back to null
	let json: unknown = null;
	try {
		json = JSON.parse(text);
	} catch {
		// Not JSON, that's fine
	}

	const result: RequestUrlResponse = {
		status: response.status,
		headers,
		arrayBuffer: Buffer.from(text).buffer as ArrayBuffer,
		json,
		text,
	};

	// Obsidian's requestUrl throws on 4xx/5xx by default
	if (params.throw !== false && response.status >= 400) {
		throw new Error(`Request failed: ${response.status} ${response.statusText}`);
	}

	return result;
}

// ============================================================================
// Other Obsidian classes (minimal implementations)
// ============================================================================

export class Notice {
	constructor(
		public message: string,
		public timeout?: number
	) {
		// Silent in tests - could log if debugging
		// console.log(`[Notice] ${message}`);
	}
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
		// Create a minimal HTMLElement for Node environment
		this.containerEl = {
			empty: () => {},
			createEl: () => ({}),
		} as unknown as HTMLElement;
	}

	display(): void {}
	hide(): void {}
}

export class Setting {
	constructor(_containerEl: unknown) {}
	setName(_name: string): this {
		return this;
	}
	setDesc(_desc: string): this {
		return this;
	}
	setClass(_cls: string): this {
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
	addDropdown(_cb: (dropdown: DropdownComponent) => void): this {
		return this;
	}
	addButton(_cb: (button: ButtonComponent) => void): this {
		return this;
	}
}

export class TextComponent {
	inputEl = { style: {} };
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
	inputEl = { style: {}, rows: 0 };
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

export class DropdownComponent {
	addOption(_value: string, _display: string): this {
		return this;
	}
	setValue(_value: string): this {
		return this;
	}
	onChange(_cb: (value: string) => void): this {
		return this;
	}
}

export class ButtonComponent {
	setButtonText(_text: string): this {
		return this;
	}
	setCta(): this {
		return this;
	}
	onClick(_cb: () => void): this {
		return this;
	}
}
