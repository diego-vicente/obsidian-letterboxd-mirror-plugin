# Letterboxd Mirror

Sync your [Letterboxd](https://letterboxd.com) diary entries as notes in [Obsidian](https://obsidian.md).

## Features

- **RSS sync**: Automatically fetches your diary entries from Letterboxd's RSS feed
- **CSV import**: Import your complete Letterboxd data export for tags and historical entries
- **TMDB integration**: Create rich Film notes with cast, crew, and metadata from The Movie Database
- **Rewatch support**: Each viewing gets its own note with a unique ID
- **Customizable templates**: Full control over filenames and note content using `{{variables}}`
- **Auto-sync on startup**: Optionally sync new entries when Obsidian launches
- **Deduplication**: Automatically skips entries that already exist in your vault

## Installation

### From Obsidian Community Plugins

1. Open **Settings** in Obsidian
2. Go to **Community plugins** and select **Browse**
3. Search for "Letterboxd Mirror"
4. Select **Install**, then **Enable**

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/diego-vicente/obsidian-letterboxd-mirror-plugin/releases)
2. Create a folder called `letterboxd-mirror` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into this folder
4. Reload Obsidian and enable the plugin in **Settings → Community plugins**

## Quick Start

1. Open **Settings → Letterboxd Mirror**
2. Enter your Letterboxd username
3. Click the clapperboard icon in the ribbon or run the command **Letterboxd Mirror: Sync diary**

Your diary entries will be created as notes in the `Letterboxd` folder.

## Usage

### Syncing from RSS

The plugin fetches your public diary entries from `letterboxd.com/<username>/rss`. To sync:

- Click the **clapperboard icon** in the ribbon, or
- Run the command **Letterboxd Mirror: Sync diary**

### Importing from CSV

For complete data including tags, you can import from a Letterboxd data export:

1. Go to [Letterboxd Settings → Import & Export](https://letterboxd.com/settings/data/)
2. Click **Export your data** and download the ZIP file
3. Extract the ZIP file
4. In Obsidian, run **Letterboxd Mirror: Import from CSV**
5. Select the folder containing your extracted data

The import will:
- Create new notes for entries not in your vault
- Update existing notes with tags from the CSV
- Preserve any manual edits you've made to note bodies

### TMDB Integration

To create Film notes with rich metadata:

1. Get a free API token from [TMDB](https://www.themoviedb.org/settings/api)
2. Enter your token in **Settings → Letterboxd Mirror → API read access token**
3. Film notes will be created automatically when you sync diary entries

## Template Variables

### Diary Note Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{filmTitle}}` | Film title | The Godfather |
| `{{filmYear}}` | Release year | 1972 |
| `{{watchedDate}}` | Date watched (YYYY-MM-DD) | 2024-01-15 |
| `{{userRatingNo}}` | Rating as number (0.5-5) | 4.5 |
| `{{userRatingNoOver10}}` | Rating over 10 | 9 |
| `{{userRatingStars}}` | Rating as stars | ★★★★½ |
| `{{rewatch}}` | Is this a rewatch? | true/false |
| `{{review}}` | Your review text | |
| `{{link}}` | Letterboxd URL | |
| `{{posterUrl}}` | Poster image URL | |
| `{{tmdbId}}` | TMDB movie ID | 238 |
| `{{guid}}` | Unique viewing ID | 1093163294 |
| `{{tags}}` | Your Letterboxd tags | ["cinema", "favorites"] |

### Film Note Variables (TMDB)

| Variable | Description | Example |
|----------|-------------|---------|
| `{{title}}` | Movie title | The Godfather |
| `{{originalTitle}}` | Original language title | The Godfather |
| `{{year}}` | Release year | 1972 |
| `{{releaseDate}}` | Full release date | 1972-03-14 |
| `{{runtime}}` | Runtime in minutes | 175 |
| `{{runtimeFormatted}}` | Formatted runtime | 2h 55m |
| `{{overview}}` | Plot synopsis | |
| `{{tagline}}` | Movie tagline | |
| `{{genres}}` | Genre array | ["Crime", "Drama"] |
| `{{genreList}}` | Comma-separated genres | Crime, Drama |
| `{{directors}}` | Director names | ["Francis Ford Coppola"] |
| `{{cast}}` | Actor names | ["Marlon Brando", ...] |
| `{{tmdbRating}}` | TMDB rating (0-10) | 8.7 |
| `{{imdbId}}` | IMDb ID | tt0068646 |
| `{{tmdbUrl}}` | TMDB page URL | |
| `{{posterUrlL}}` | Large poster URL | |
| `{{backdropUrlL}}` | Large backdrop URL | |

### Template Modifiers

Variables support modifiers for formatting:

```
{{variable yaml=true}}     → YAML-safe output
{{variable link=true}}     → [[Wikilinks]]
{{variable quote=true}}    → > Blockquote
{{variable bold=true}}     → **Bold**
{{variable skipEmpty=true}} → Omit if empty
{{variable prefix="!" suffix=")"}} → Custom wrapping
```

### Conditional Blocks

```
{{#if rewatch}}(rewatch){{/if}}
{{#if review}}## Review\n{{review}}{{/if}}
```

## Documentation

For detailed documentation on all settings and advanced configuration, see the [docs](docs/) folder:

- [Settings](docs/Settings.md) — All configuration options explained
- [Template Variables](docs/Template-Variables.md) — Complete variable and modifier reference

## Network Disclosure

This plugin makes network requests to:

- `letterboxd.com` — to fetch your RSS feed and diary entry pages
- `api.themoviedb.org` — to fetch movie metadata (only if TMDB is configured)

No data is sent to any other servers. No analytics or telemetry is collected.

## License

[MIT](LICENSE) — Diego Vicente

## Credits

- Film data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Built for [Obsidian](https://obsidian.md)
