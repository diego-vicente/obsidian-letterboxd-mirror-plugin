# Settings

All plugin settings are found in **Settings → Letterboxd Mirror**.

## General Settings

### Letterboxd username

Your Letterboxd username. This is used to fetch your diary entries from `letterboxd.com/<username>/rss`.

- **Required**: Yes
- **Default**: Empty

### Diary folder

The folder in your vault where diary entry notes will be created.

- **Required**: No
- **Default**: `Letterboxd`

### Sync on startup

When enabled, the plugin will automatically sync new diary entries when Obsidian starts.

- **Default**: Enabled

### Reviews only

When enabled, only diary entries that have a review will be synced. Watch-only logs (entries without a review) will be skipped.

- **Default**: Disabled

### Notifications

Controls when sync notifications are shown.

| Option | Description |
|--------|-------------|
| **Verbose** | Shows all messages: sync start, completion, errors, and counts |
| **New files only** | Only shows a notification when new files are created |
| **Silent** | No notifications (errors are still logged to console) |

- **Default**: Verbose

## Diary Templates

### Filename template

Template for diary note filenames. Supports template variables.

- **Default**: `{{watchedDate}} - {{filmTitle}}`
- **Example output**: `2024-01-15 - The Godfather.md`

Available variables: `{{filmTitle}}`, `{{filmYear}}`, `{{watchedDate}}`, `{{tmdbId}}`

### Note template

Template for diary note content. Click **Edit template** to open the template editor.

See [Template Variables](Template-Variables.md) for all available variables and modifiers.

## TMDB Integration

The Movie Database (TMDB) integration allows you to create Film notes with rich metadata including cast, crew, genres, and more.

### API read access token

Your TMDB API Read Access Token (Bearer token).

**To get a token:**
1. Create a free account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to [API Settings](https://www.themoviedb.org/settings/api)
3. Copy the **API Read Access Token** (not the API Key)

- **Required**: No (TMDB features are disabled without a token)
- **Default**: Empty

### Films folder

The folder in your vault where Film notes will be created.

- **Default**: `Films`

### Language

The preferred language for TMDB data (titles, overviews, etc.).

Supported languages include: English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, and many more.

- **Default**: English (US)

### Film filename template

Template for Film note filenames.

- **Default**: `{{title}} ({{year}})`
- **Example output**: `The Godfather (1972).md`

Available variables: `{{title}}`, `{{originalTitle}}`, `{{year}}`, `{{tmdbId}}`, `{{imdbId}}`

### Film note template

Template for Film note content. Click **Edit template** to open the template editor.

See [Template Variables](Template-Variables.md) for all available TMDB variables.

## Advanced Settings

### Diary GUID frontmatter key

The frontmatter key used to store the unique Letterboxd entry ID. This is used for deduplication to prevent creating duplicate notes for the same diary entry.

- **Default**: `letterboxd_guid`

> **Warning**: Changing this after you have synced entries may cause duplicates.

### Film TMDB ID frontmatter key

The frontmatter key used to store the TMDB ID in Film notes. This is used for deduplication.

- **Default**: `tmdb_id`

> **Warning**: Changing this after you have created Film notes may cause duplicates.
