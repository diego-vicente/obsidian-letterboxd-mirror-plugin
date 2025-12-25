/**
 * Shared vault utilities for folder operations
 */

import { TFolder } from "obsidian";
import type LetterboxdPlugin from "../main";

/**
 * Ensures a folder exists in the vault, creating it if necessary
 * @param plugin - Plugin instance for vault access
 * @param folderPath - Path to the folder
 */
export async function ensureFolderExists(
	plugin: LetterboxdPlugin,
	folderPath: string
): Promise<void> {
	const { vault } = plugin.app;
	const folder = vault.getAbstractFileByPath(folderPath);
	if (!(folder instanceof TFolder)) {
		await vault.createFolder(folderPath);
	}
}
