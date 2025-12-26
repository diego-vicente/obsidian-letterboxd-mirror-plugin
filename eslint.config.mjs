import tsparser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import obsidianmd from "eslint-plugin-obsidianmd";

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Global ignores (must be first)
	{
		ignores: ["e2e/**/*", "node_modules/**/*", "main.js", "*.mjs"],
	},

	// TypeScript files configuration with obsidian rules
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				project: "./tsconfig.json",
				sourceType: "module",
			},
		},
		plugins: {
			"@typescript-eslint": tseslint,
			obsidianmd: obsidianmd,
		},
		rules: {
			// TypeScript rules
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/no-floating-promises": "error",
			"@typescript-eslint/require-await": "error",

			// Obsidian recommended rules
			...obsidianmd.configs.recommended,

			// Override sentence-case to allow our brand names and acronyms
			"obsidianmd/ui/sentence-case": [
				"error",
				{
					brands: ["Letterboxd", "TMDB", "Obsidian", "The Movie Database"],
					acronyms: ["CSV", "API", "GUID", "ID", "URL"],
				},
			],
		},
	},
];
