# Template Variables

Templates use `{{variable}}` syntax for dynamic content. Variables can include modifiers for formatting.

## Diary Note Variables

These variables are available in diary note templates.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{filmTitle}}` | string | Film title | The Godfather |
| `{{filmYear}}` | number | Release year | 1972 |
| `{{watchedDate}}` | string | Date watched (YYYY-MM-DD) | 2024-01-15 |
| `{{watchedDatetime}}` | string | Date and time watched | 2024-01-15T00:00 |
| `{{userRatingNo}}` | number | Rating (0.5-5 scale) | 4.5 |
| `{{userRatingNoOver10}}` | number | Rating (1-10 scale) | 9 |
| `{{userRatingStars}}` | string | Rating as star characters | ★★★★½ |
| `{{rewatch}}` | boolean | Is this a rewatch? | true |
| `{{review}}` | string | Your review text | |
| `{{link}}` | string | Letterboxd diary entry URL | |
| `{{posterUrl}}` | string | Film poster image URL | |
| `{{tmdbId}}` | string | TMDB movie ID | 238 |
| `{{guid}}` | string | Unique viewing ID | 1093163294 |
| `{{pubDate}}` | string | Date logged on Letterboxd | 2024-01-16 |
| `{{containsSpoilers}}` | boolean | Review has spoiler warning | false |
| `{{tags}}` | array | Your Letterboxd tags | ["cinema", "favorites"] |

## Film Note Variables (TMDB)

These variables are available in Film note templates when TMDB integration is enabled.

### Basic Information

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{tmdbId}}` | number | TMDB movie ID | 238 |
| `{{title}}` | string | Movie title (localized) | The Godfather |
| `{{originalTitle}}` | string | Original language title | The Godfather |
| `{{originalLanguage}}` | string | Original language code | en |
| `{{year}}` | number | Release year | 1972 |
| `{{releaseDate}}` | string | Full release date | 1972-03-14 |
| `{{runtime}}` | number | Runtime in minutes | 175 |
| `{{runtimeFormatted}}` | string | Human-readable runtime | 2h 55m |
| `{{overview}}` | string | Plot synopsis | |
| `{{tagline}}` | string | Movie tagline | |

### Ratings & IDs

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{tmdbRating}}` | number | TMDB community rating (0-10) | 8.7 |
| `{{tmdbVoteCount}}` | number | Number of TMDB votes | 19847 |
| `{{imdbId}}` | string | IMDb ID | tt0068646 |
| `{{tmdbUrl}}` | string | TMDB page URL | |

### Categories

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{genres}}` | array | Genre names | ["Crime", "Drama"] |
| `{{genreList}}` | string | Comma-separated genres | Crime, Drama |
| `{{collection}}` | string | Collection name | The Godfather Collection |

### People

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{directors}}` | array | Director names | ["Francis Ford Coppola"] |
| `{{cast}}` | array | Actor names | ["Marlon Brando", "Al Pacino"] |
| `{{characters}}` | array | Character names (same order as cast) | ["Don Vito Corleone", "Michael Corleone"] |

### Production

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{productionCompanies}}` | array | Company names | ["Paramount Pictures"] |
| `{{productionCompanyList}}` | string | Comma-separated companies | Paramount Pictures |
| `{{spokenLanguages}}` | array | Language names | ["English", "Italian"] |
| `{{spokenLanguageList}}` | string | Comma-separated languages | English, Italian |
| `{{budget}}` | number | Budget in dollars | 6000000 |
| `{{revenue}}` | number | Revenue in dollars | 245066411 |

### Images

Poster images in various sizes:

| Variable | Size |
|----------|------|
| `{{posterUrlXXS}}` | 92px wide |
| `{{posterUrlXS}}` | 154px wide |
| `{{posterUrlS}}` | 185px wide |
| `{{posterUrlM}}` | 342px wide |
| `{{posterUrlL}}` | 500px wide |
| `{{posterUrlXL}}` | 780px wide |
| `{{posterUrlOG}}` | Original size |

Backdrop images:

| Variable | Size |
|----------|------|
| `{{backdropUrlS}}` | 300px wide |
| `{{backdropUrlM}}` | 780px wide |
| `{{backdropUrlL}}` | 1280px wide |
| `{{backdropUrlOG}}` | Original size |

## Modifiers

Modifiers change how a variable is rendered. Add them after the variable name.

### YAML Formatting

```
{{variable yaml=true}}
```

Outputs the value in YAML-safe format. Useful in frontmatter.

- Strings with special characters are quoted
- Arrays become YAML lists

### Links

```
{{directors link=true}}
```

Wraps each item in Obsidian wikilinks: `[[Francis Ford Coppola]]`

### Text Formatting

```
{{tagline quote=true}}    → > An offer you can't refuse.
{{tagline bold=true}}     → **An offer you can't refuse.**
{{tagline italic=true}}   → *An offer you can't refuse.*
```

### Skip Empty

```
{{review skipEmpty=true}}
```

If the variable is empty, nothing is output (instead of an empty string or placeholder).

### Prefix and Suffix

```
{{posterUrl prefix="![Poster](" suffix=")"}}
```

Adds text before and after the value. Combined with `skipEmpty`, you can conditionally include formatting:

```
{{posterUrl skipEmpty=true prefix="![Poster](" suffix=")"}}
```

### Bullet Lists

```
{{cast bullet=true}}
```

Outputs each array item as a bullet point:
```
- Marlon Brando
- Al Pacino
- James Caan
```

### Cast with Roles

A special formatter for cast members that includes character names:

```
{{castWithRoles bullet=true linkActors=true}}
```

Output:
```
- [[Marlon Brando]] as Don Vito Corleone
- [[Al Pacino]] as Michael Corleone
```

## Conditional Blocks

Use `{{#if variable}}...{{/if}}` for conditional content:

```
{{#if rewatch}}(rewatch){{/if}}

{{#if review}}
## Review
{{review}}
{{/if}}

{{#if imdbId}}[IMDb](https://imdb.com/title/{{imdbId}}){{/if}}
```

The block is only rendered if the variable is truthy (not empty, not false, not null).

## Default Templates

### Default Diary Note Template

```markdown
---
film: "[[{{filmTitle}} ({{filmYear}})]]"
rating: {{userRatingNoOver10}}
watched_date: {{watchedDate}}
letterboxd_url: {{link yaml=true}}
tmdb_id: {{tmdbId}}
poster: {{posterUrl yaml=true}}
letterboxd_guid: {{guid}}
letterboxd_tags: {{tags yaml=true}}
---

# [[{{filmTitle}} ({{filmYear}})]]

{{posterUrl skipEmpty=true prefix="![Poster](" suffix=")"}}

**Rating**: {{userRatingStars}}
**Watched**: {{watchedDate}}{{#if rewatch}} (rewatch){{/if}}

{{review skipEmpty=true quote=true}}

---
[View on Letterboxd]({{link}})
```

### Default Film Note Template

```markdown
---
title: "{{title}}"
original_title: "{{originalTitle}}"
year: {{year}}
release_date: {{releaseDate}}
runtime: {{runtime}}
tmdb_id: {{tmdbId}}
imdb_id: "{{imdbId}}"
tmdb_rating: {{tmdbRating}}
genres: {{genres yaml=true}}
directors: {{directors yaml=true link=true}}
cast: {{cast yaml=true link=true}}
poster: "{{posterUrlL}}"
---

# {{title}} ({{year}})

{{posterUrlL skipEmpty=true prefix="![Poster](" suffix=")"}}

{{tagline quote=true bold=true}}
{{overview quote=true}}

**Runtime**: {{runtimeFormatted}}
**Genres**: {{genreList}}

## Cast

{{castWithRoles bullet=true linkActors=true}}

---
[TMDB]({{tmdbUrl}}){{#if imdbId}} | [IMDb](https://imdb.com/title/{{imdbId}}){{/if}}
```
