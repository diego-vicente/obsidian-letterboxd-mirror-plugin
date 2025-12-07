import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/main.ts"],
		},
	},
	resolve: {
		alias: {
			// Mock obsidian module for unit tests
			obsidian: path.resolve(__dirname, "src/__tests__/mocks/obsidian.ts"),
		},
	},
});
