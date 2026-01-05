# Usage

## Quick Start

1. Open **Settings → Letterboxd Mirror**
2. Enter your Letterboxd username
3. Click the clapperboard icon in the ribbon or run **Letterboxd Mirror: Sync diary**

Your diary entries will appear as notes in the `Letterboxd` folder.

## Syncing from RSS

The plugin fetches your public diary entries from `letterboxd.com/<username>/rss`.

### How to Sync

- Click the **clapperboard icon** in the ribbon, or
- Run the command **Letterboxd Mirror: Sync diary** (Cmd/Ctrl+P)

### What Gets Synced

Each diary entry creates a note with:
- Film title and year
- Your rating (if any)
- Watch date
- Rewatch indicator
- Your review (if any)
- Poster image URL
- TMDB ID (for linking to Film notes)

### Automatic Sync

Enable **Sync on startup** in settings to automatically fetch new entries when Obsidian launches.

### Reviews Only Mode

Enable **Reviews only** in settings to skip watch-only logs and only sync entries that have a written review.

## Importing from CSV

For complete data including tags, import from a Letterboxd data export.

### How to Export from Letterboxd

1. Go to [Letterboxd Settings → Import & Export](https://letterboxd.com/settings/data/)
2. Click **Export your data**
3. Download and extract the ZIP file

### How to Import

1. In Obsidian, run **Letterboxd Mirror: Import from CSV**
2. Select the folder containing your extracted Letterboxd data (the folder with `diary.csv`)

### What the Import Does

- Creates new notes for entries not already in your vault
- Updates existing notes with tags from the CSV
- Preserves any manual edits you've made to note content
- Only updates frontmatter fields, never overwrites the note body

### Tags

Tags from Letterboxd are stored in the `letterboxd_tags` frontmatter field. RSS-synced entries have a placeholder tag `["_pending_csv_import"]` until you run a CSV import.

## TMDB Integration

The Movie Database (TMDB) integration creates Film notes with rich metadata.

### Setting Up TMDB

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to [API Settings](https://www.themoviedb.org/settings/api)
3. Copy the **API Read Access Token** (not the API Key)
4. Paste it in **Settings → Letterboxd Mirror → API read access token**

### How It Works

When you sync diary entries:
1. Each diary entry note is created in your diary folder (default: `Letterboxd/`)
2. A corresponding Film note is created in the films folder (default: `Films/`)
3. The diary note links to the Film note via the `film` frontmatter field

### Film Note Content

Film notes include:
- Title (localized to your preferred language)
- Original title
- Release date and runtime
- Plot overview and tagline
- Genres
- Directors and cast with character names
- TMDB and IMDb ratings
- Poster and backdrop images
- Budget and revenue
- Production companies
- Spoken languages

### Language Setting

Set your preferred language in **Settings → TMDB → Language**. This affects:
- Movie titles
- Plot overviews
- Genre names

Original titles are always preserved in the `original_title` field.

## Deduplication

The plugin prevents duplicate notes using unique identifiers:

- **Diary notes**: Use the Letterboxd viewing ID (`letterboxd_guid`)
- **Film notes**: Use the TMDB ID (`tmdb_id`)

Each viewing of a film gets its own diary note, so rewatches are fully supported.

## Commands

| Command | Description |
|---------|-------------|
| **Sync diary** | Fetch new entries from RSS and create notes |
| **Import from CSV** | Import from Letterboxd data export |

## Network Requests

This plugin makes network requests to:

| Host | Purpose |
|------|---------|
| `letterboxd.com` | Fetch RSS feed and diary entry pages |
| `api.themoviedb.org` | Fetch movie metadata (only if TMDB is configured) |

No data is sent to any other servers. No analytics or telemetry is collected.
