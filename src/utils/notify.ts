import { Notice } from "obsidian";
import type { NotificationLevel } from "../types";

/**
 * Shows a notification based on the notification level setting
 * @param message - The message to display
 * @param level - Current notification level setting
 * @param type - Type of notification: "progress" (verbose only), "result" (verbose or newFilesOnly with changes), "error" (always)
 * @param hasNewFiles - Whether new files were created (for "result" type)
 */
export function notify(
	message: string,
	level: NotificationLevel,
	type: "progress" | "result" | "error",
	hasNewFiles = false
): void {
	if (type === "error") {
		// Errors always show
		new Notice(message);
		return;
	}

	if (level === "silent") {
		return;
	}

	if (level === "verbose") {
		new Notice(message);
		return;
	}

	// level === "newFilesOnly"
	if (type === "result" && hasNewFiles) {
		new Notice(message);
	}
}
