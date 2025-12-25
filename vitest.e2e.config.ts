import { defineConfig } from "vitest/config";
import * as path from "path";

/**
 * Vitest config for E2E tests
 *
 * Key differences from unit tests:
 * - Uses a real-HTTP mock for obsidian's requestUrl
 * - Longer timeouts (network requests)
 * - Separate test file pattern
 */
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["e2e/**/*.test.ts"],
		testTimeout: 30000, // 30 seconds for network requests
		hookTimeout: 30000,
		// Setup file that runs before tests
		setupFiles: ["e2e/vitest-setup.ts"],
		// E2E tests should run sequentially to avoid rate limiting
		sequence: {
			concurrent: false,
		},
		fileParallelism: false,
	},
	resolve: {
		alias: {
			// Use our E2E mock that makes real HTTP requests
			obsidian: path.resolve(__dirname, "e2e/obsidian-mock.ts"),
		},
	},
});
