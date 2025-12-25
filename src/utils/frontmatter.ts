/**
 * Shared utilities for frontmatter parsing
 */

/**
 * Creates a regex to match a key-value pair in YAML frontmatter
 * @param key - The frontmatter key to match (will be escaped for regex)
 * @returns Regex that matches `key: value` and captures the value
 *
 * @example
 * const regex = createFrontmatterKeyRegex("tmdb_id");
 * const match = content.match(regex);
 * if (match) console.log(match[1]); // The value
 */
export function createFrontmatterKeyRegex(key: string): RegExp {
	const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escapedKey}:\\s*(.+)$`, "m");
}
