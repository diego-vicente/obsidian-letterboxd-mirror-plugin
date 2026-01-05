# Template Variables

Templates use [Eta](https://eta.js.org/) syntax with fluent method chaining. The basic syntax is `<%= it.variable %>` for outputting values, and `<% %>` for JavaScript logic.

## Syntax Overview

```eta
<%= it.title %>                    Output a value
<%= it.genres.link().bullet() %>   Chain methods for formatting
<% if (it.rewatch.isTrue()) { %>   JavaScript conditionals
  (rewatch)
<% } %>
```

### The `it.` Prefix

All template variables are accessed through `it.` — this is [Eta's standard convention](https://eta.js.org/docs/learn/template-syntax) for accessing the data object passed to templates. Think of `it` as "the current item" being templated (your diary entry or film).

```eta
<%= it.filmTitle %>     ✓ Correct
<%= filmTitle %>        ✗ Won't work
```

This design allows Eta templates to use any valid JavaScript expression while keeping a clear namespace for your data.

## Diary Note Variables

These variables are available in diary note templates.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `it.filmTitle` | string | Film title | The Godfather |
| `it.filmYear` | number | Release year | 1972 |
| `it.watchedDate` | string | Date watched (YYYY-MM-DD) | 2024-01-15 |
| `it.watchedDatetime` | string | Date and time watched | 2024-01-15T00:00 |
| `it.userRating` | rating | User rating (see [Rating Methods](#rating-methods)) | 4.5 |
| `it.rewatch` | boolean | Is this a rewatch? | true |
| `it.review` | string | Your review text | |
| `it.link` | string | Letterboxd diary entry URL | |
| `it.posterUrl` | string | Film poster image URL | |
| `it.tmdbId` | string | TMDB movie ID | 238 |
| `it.guid` | string | Unique viewing ID | 1093163294 |
| `it.pubDate` | string | Date logged on Letterboxd | 2024-01-16 |
| `it.containsSpoilers` | boolean | Review has spoiler warning | false |
| `it.tags` | array | Your Letterboxd tags | ["cinema", "favorites"] |

## Film Note Variables (TMDB)

These variables are available in Film note templates when TMDB integration is enabled.

### Basic Information

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `it.tmdbId` | number | TMDB movie ID | 238 |
| `it.title` | string | Movie title (localized) | The Godfather |
| `it.originalTitle` | string | Original language title | The Godfather |
| `it.originalLanguage` | string | Original language code | en |
| `it.year` | number | Release year | 1972 |
| `it.releaseDate` | string | Full release date | 1972-03-14 |
| `it.runtime` | number | Runtime in minutes | 175 |
| `it.runtimeFormatted` | string | Human-readable runtime | 2h 55m |
| `it.overview` | string | Plot synopsis | |
| `it.tagline` | string | Movie tagline | |

### Ratings & IDs

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `it.tmdbRating` | number | TMDB community rating (0-10) | 8.7 |
| `it.tmdbVoteCount` | number | Number of TMDB votes | 19847 |
| `it.imdbId` | string | IMDb ID | tt0068646 |
| `it.tmdbUrl` | string | TMDB page URL | |

### Categories & Production

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `it.genres` | array | Genre names | ["Crime", "Drama"] |
| `it.collection` | string | Collection name | The Godfather Collection |
| `it.productionCompanies` | array | Company names | ["Paramount Pictures"] |
| `it.spokenLanguages` | array | Language names | ["English", "Italian"] |
| `it.budget` | number | Budget in dollars | 6000000 |
| `it.revenue` | number | Revenue in dollars | 245066411 |

### People

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `it.directors` | array | Director names | ["Francis Ford Coppola"] |
| `it.cast` | array | Actor names | ["Marlon Brando", "Al Pacino"] |
| `it.characters` | array | Character names (same order as cast) | ["Don Vito Corleone", "Michael Corleone"] |
| `it.castWithRoles` | special | Cast with character names (see [Cast with Roles](#cast-with-roles)) | |

### Images

Images use the `.size()` method to select dimensions. You can use named sizes or pixel widths.

| Variable | Type | Description |
|----------|------|-------------|
| `it.poster` | image | Movie poster |
| `it.backdrop` | image | Movie backdrop |

**Poster sizes:**

| Name | Pixels | Example |
|------|--------|---------|
| XXS | 92 | `it.poster.size("XXS")` or `it.poster.size(92)` |
| XS | 154 | `it.poster.size("XS")` or `it.poster.size(154)` |
| S | 185 | `it.poster.size("S")` or `it.poster.size(185)` |
| M | 342 | `it.poster.size("M")` or `it.poster.size(342)` |
| L | 500 | `it.poster.size("L")` or `it.poster.size(500)` |
| XL | 780 | `it.poster.size("XL")` or `it.poster.size(780)` |
| OG | original | `it.poster.size("OG")` |

**Backdrop sizes:**

| Name | Pixels | Example |
|------|--------|---------|
| S | 300 | `it.backdrop.size("S")` or `it.backdrop.size(300)` |
| M | 780 | `it.backdrop.size("M")` or `it.backdrop.size(780)` |
| L | 1280 | `it.backdrop.size("L")` or `it.backdrop.size(1280)` |
| OG | original | `it.backdrop.size("OG")` |

---

## Fluent Methods

All variables support chainable methods for formatting. Methods are called with `.methodName()` syntax.

### String Methods

Available on string variables like `it.title`, `it.review`, `it.link`.

| Method | Description | Example |
|--------|-------------|---------|
| `.link()` | Wrap in wiki-link brackets; empty string produces `[[]]` | `it.title.link()` → `[[The Godfather]]` |
| `.bold()` | Apply bold formatting | `it.title.bold()` → `**The Godfather**` |
| `.italic()` | Apply italic formatting | `it.title.italic()` → `*The Godfather*` |
| `.quote()` | Convert to blockquote; empty string produces `> ` | `it.tagline.quote()` → `> An offer you can't refuse.` |
| `.yaml()` | Wrap in YAML-safe quotes; empty string produces `""` | `it.link.yaml()` → `"https://..."` |
| `.prefix(str)` | Add text before | `it.title.prefix("Film: ")` → `Film: The Godfather` |
| `.suffix(str)` | Add text after | `it.year.suffix(" AD")` → `1972 AD` |
| `.isEmpty()` | Check if empty (for conditionals) | `<% if (!it.review.isEmpty()) { %>` |
| `.skipEmpty()` | Return value only if non-empty | `it.tagline.skipEmpty()` |
| `.toNative()` | Get raw JavaScript string | `it.title.toNative().toUpperCase()` |

**Chaining example:**
```eta
<%= it.title.link().bold() %>
```
Output: `**[[The Godfather]]**`

### Array Methods

Available on array variables like `it.genres`, `it.cast`, `it.tags`.

| Method | Description | Example |
|--------|-------------|---------|
| `.top(n)` | Take first n items | `it.cast.top(5)` |
| `.link()` | Wrap each item in wiki-links | `it.cast.link()` → `[[Actor 1]], [[Actor 2]]` |
| `.bold()` | Apply bold to each item | `it.genres.bold()` |
| `.italic()` | Apply italic to each item | `it.genres.italic()` |
| `.join(sep)` | Join with custom separator | `it.genres.join(" / ")` → `Crime / Drama` |
| `.bullet()` | Format as bullet list; empty array produces empty string | See below |
| `.yaml()` | Format as YAML inline array; empty array produces `[]` | `["Crime", "Drama"]` |
| `.yamlMultiline()` | Format as YAML multiline list; empty array produces empty string | See below |
| `.map(fn)` | Transform each item | `it.cast.map(x => x.toUpperCase())` |
| `.filter(fn)` | Filter items | `it.tags.filter(t => t !== "watched")` |
| `.isEmpty()` | Check if empty | `<% if (!it.tags.isEmpty()) { %>` |
| `.toNative()` | Get raw JavaScript array | `it.genres.toNative().reverse()` |

**Default output:** Arrays automatically output as comma-separated when used directly:
```eta
<%= it.genres %>
```
Output: `Crime, Drama`

**Bullet list:**
```eta
<%= it.cast.top(3).link().bullet() %>
```
Output:
```
- [[Marlon Brando]]
- [[Al Pacino]]
- [[James Caan]]
```

**YAML formats:**
```eta
genres: <%= it.genres.yaml() %>
tags:
<%= it.tags.yamlMultiline() %>
```
Output:
```yaml
genres: ["Crime", "Drama"]
tags:
  - favorite
  - rewatch
```

### Number Methods

Available on number variables like `it.year`, `it.runtime`, `it.tmdbRating`.

| Method | Description | Example |
|--------|-------------|---------|
| `.times(n)` | Multiply by n | `it.runtime.times(60)` → seconds |
| `.fixed(digits)` | Format with decimal places | `it.tmdbRating.fixed(1)` → `8.7` |
| `.prefix(str)` | Add text before | `it.runtime.prefix("Runtime: ")` |
| `.suffix(str)` | Add text after | `it.runtime.suffix(" min")` → `175 min` |
| `.isZero()` | Check if zero | `<% if (!it.budget.isZero()) { %>` |
| `.toNative()` | Get raw JavaScript number | `it.year.toNative() + 1` |

### Boolean Methods

Available on boolean variables like `it.rewatch`, `it.containsSpoilers`.

| Method | Description | Example |
|--------|-------------|---------|
| `.isTrue()` | Check if true | `<% if (it.rewatch.isTrue()) { %>` |
| `.isFalse()` | Check if false | `<% if (it.containsSpoilers.isFalse()) { %>` |
| `.ifElse(a, b)` | Return a if true, b if false | `it.rewatch.ifElse("Rewatch", "First watch")` |
| `.toNative()` | Get raw JavaScript boolean | |

### Rating Methods

The `it.userRating` variable has special methods for formatting ratings.

| Method | Description | Example |
|--------|-------------|---------|
| `.over(base)` | Scale to different base; unrated returns `0` | `it.userRating.over(10)` → 7 (from 3.5) |
| `.stars()` | Convert to star characters; unrated returns empty string | `it.userRating.stars()` → `★★★½` |
| `.isRated()` | Check if rated | `<% if (it.userRating.isRated()) { %>` |
| `.isUnrated()` | Check if unrated | `<% if (it.userRating.isUnrated()) { %>` |
| `.toNative()` | Get raw number; returns `null` if unrated | |

**Examples:**
```eta
Rating: <%= it.userRating.over(5) %>/5
Rating: <%= it.userRating.over(10) %>/10
Rating: <%= it.userRating.over(100) %>%
Rating: <%= it.userRating.stars() %>
Rating: <%= it.userRating.stars().bold() %>
```

### Image Methods

The `it.poster` and `it.backdrop` variables have methods for selecting image sizes.

| Method | Description | Example |
|--------|-------------|---------|
| `.size(s)` | Get URL at size (name or pixels); no image returns empty string | `it.poster.size("L")` or `it.poster.size(500)` |
| `.url()` | Get URL at default size; no image returns empty string | `it.poster.url()` |
| `.isEmpty()` | Check if image exists | `<% if (!it.poster.isEmpty()) { %>` |
| `.toNative()` | Get raw image path | |

**Example:**
```eta
<% if (!it.poster.isEmpty()) { %>
![Poster](<%= it.poster.size("L") %>)
<% } %>
```

### Cast with Roles

The `it.castWithRoles` helper combines cast and character names.

| Method | Description |
|--------|-------------|
| `.top(n)` | Limit to first n cast members |
| `.linkActors()` | Wrap actor names in wiki-links |
| `.linkCharacters()` | Wrap character names in wiki-links |
| `.bullet()` | Format as bullet list |
| `.yaml()` | Format as YAML inline array |
| `.yamlMultiline()` | Format as YAML multiline list |

**Example:**
```eta
<%= it.castWithRoles.top(5).linkActors().bullet() %>
```
Output:
```
- [[Marlon Brando]] as Don Vito Corleone
- [[Al Pacino]] as Michael Corleone
- [[James Caan]] as Sonny Corleone
```

---

## Conditionals

Use standard JavaScript conditionals with `<% %>` tags:

```eta
<% if (it.rewatch.isTrue()) { %>
(rewatch)
<% } %>

<% if (!it.review.isEmpty()) { %>
## Review
<%= it.review.quote() %>
<% } %>

<% if (!it.imdbId.isEmpty()) { %>
[IMDb](https://imdb.com/title/<%= it.imdbId %>)
<% } %>
```

---

## YAML and Frontmatter

When outputting values in YAML frontmatter, use the `.yaml()` methods to ensure proper formatting and escaping.

### Why Use YAML Methods?

YAML frontmatter requires specific formatting:
- Strings with special characters (colons, quotes, newlines) must be quoted
- Arrays need bracket notation or multiline list format
- Unquoted values can break frontmatter parsing

### String Values

Use `.yaml()` to safely quote strings:

```eta
---
title: <%= it.title.yaml() %>
url: <%= it.link.yaml() %>
---
```

Output:
```yaml
---
title: "The Godfather"
url: "https://letterboxd.com/user/film/the-godfather/"
---
```

If the title contains quotes, they're automatically escaped:
```yaml
title: "The \"Godfather\""
```

### Array Values

Two formats are available for arrays:

**Inline format** with `.yaml()`:
```eta
---
genres: <%= it.genres.yaml() %>
cast: <%= it.cast.top(5).link().yaml() %>
---
```

Output:
```yaml
---
genres: ["Crime", "Drama"]
cast: ["[[Marlon Brando]]", "[[Al Pacino]]", "[[James Caan]]", "[[Robert Duvall]]", "[[Richard S. Castellano]]"]
---
```

**Multiline format** with `.yamlMultiline()`:
```eta
---
tags:
<%= it.tags.yamlMultiline() %>
---
```

Output:
```yaml
---
tags:
  - favorite
  - rewatch
  - cinema
---
```

### When NOT to Use YAML Methods

For simple values that don't need escaping, you can output directly:

```eta
---
year: <%= it.year %>
runtime: <%= it.runtime %>
tmdb_id: <%= it.tmdbId %>
rating: <%= it.userRating.over(10) %>
---
```

---

## Advanced: Custom JavaScript

Since templates use [Eta](https://eta.js.org/), you can write any JavaScript expression. Use `.toNative()` to escape from fluent wrappers to raw JavaScript values.

### Basic Expressions

```eta
<%= it.title.toNative().toUpperCase() %>

<%= it.year.toNative() >= 2000 ? "Modern" : "Classic" %>
```

### Working with Arrays

The fluent API covers common cases, but JavaScript's array methods offer more flexibility:

```eta
<%# Reverse genre order %>
<%= it.genres.toNative().reverse().join(" | ") %>

<%# Get only genres starting with "A" %>
<%= it.genres.toNative().filter(g => g.startsWith("A")).join(", ") %>

<%# Count cast members %>
This film has <%= it.cast.toNative().length %> credited actors.

<%# Check if a specific genre exists %>
<% if (it.genres.toNative().includes("Horror")) { %>
🎃 This is a horror film!
<% } %>
```

### String Manipulation

For text transformations not covered by fluent methods:

```eta
<%# Title case %>
<%= it.title.toNative().split(" ").map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ") %>

<%# Extract first word %>
<%= it.title.toNative().split(" ")[0] %>

<%# Truncate long overview %>
<% const overview = it.overview.toNative(); %>
<%= overview.length > 200 ? overview.substring(0, 200) + "..." : overview %>

<%# Replace characters %>
<%= it.title.toNative().replace(/:/g, " -") %>
```

### Number Formatting

```eta
<%# Format budget with currency %>
<% const budget = it.budget.toNative(); %>
<% if (budget > 0) { %>
Budget: $<%= budget.toLocaleString() %>
<% } %>

<%# Calculate profit %>
<% const profit = it.revenue.toNative() - it.budget.toNative(); %>
<% if (profit > 0) { %>
Profit: $<%= profit.toLocaleString() %>
<% } %>

<%# Round TMDB rating %>
<%= Math.round(it.tmdbRating.toNative()) %>/10
```

### Date Manipulation

```eta
<%# Extract year from watched date %>
<%= it.watchedDate.toNative().split("-")[0] %>

<%# Format date differently %>
<% const [year, month, day] = it.watchedDate.toNative().split("-"); %>
Watched on <%= day %>/<%= month %>/<%= year %>

<%# Calculate film age %>
<% const filmAge = new Date().getFullYear() - it.year.toNative(); %>
This film is <%= filmAge %> years old.
```

### Complex Conditionals

```eta
<%# Multi-condition logic %>
<% const rating = it.tmdbRating.toNative(); %>
<% const year = it.year.toNative(); %>
<% if (rating >= 8 && year >= 2000) { %>
Modern classic
<% } else if (rating >= 8) { %>
Classic
<% } else if (year >= 2000) { %>
Modern film
<% } %>

<%# Rating tier %>
<% const r = it.userRating.toNative(); %>
<% const tier = r >= 4.5 ? "Masterpiece" : r >= 3.5 ? "Great" : r >= 2.5 ? "Good" : r >= 1.5 ? "Mediocre" : "Poor"; %>
Tier: <%= tier %>
```

### Combining Data

```eta
<%# Zip cast with characters manually %>
<% const cast = it.cast.toNative(); %>
<% const chars = it.characters.toNative(); %>
<% for (let i = 0; i < Math.min(cast.length, 3); i++) { %>
- **<%= cast[i] %>** plays _<%= chars[i] || "Unknown" %>_
<% } %>

<%# Create custom formatted list %>
<% const genres = it.genres.toNative(); %>
<% genres.forEach((genre, i) => { %>
<%= i + 1 %>. <%= genre %>
<% }); %>
```

---

## Recipes

Ready-to-use template snippets for common use cases.

### Poster with Fallback

Display poster only if available:

```eta
<% if (!it.posterUrl.isEmpty()) { %>
![Poster](<%= it.posterUrl %>)
<% } %>
```

For Film notes with size control:

```eta
<% if (!it.poster.isEmpty()) { %>
![<%= it.title %>](<%= it.poster.size("L") %>)
<% } %>
```

### Rating Display Variations

```eta
<%# Stars only %>
<%= it.userRating.stars() %>

<%# Stars with numeric %>
<%= it.userRating.stars() %> (<%= it.userRating.over(10) %>/10)

<%# Bold stars %>
**<%= it.userRating.stars() %>**

<%# Handle unrated %>
<% if (it.userRating.isRated()) { %>
Rating: <%= it.userRating.stars() %>
<% } else { %>
Rating: Not yet rated
<% } %>
```

### Rewatch Badge

Inline rewatch indicator:

```eta
**Watched**: <%= it.watchedDate %><%= it.rewatch.ifElse(" (rewatch)", "") %>
```

Or with conditional block:

```eta
**Watched**: <%= it.watchedDate %><% if (it.rewatch.isTrue()) { %> 🔄<% } %>
```

### Review with Spoiler Warning

```eta
<% if (!it.review.isEmpty()) { %>
## Review
<% if (it.containsSpoilers.isTrue()) { %>
> ⚠️ **Warning: Contains spoilers**

<% } %>
<%= it.review.quote() %>
<% } %>
```

### Linked Genres with Custom Separator

```eta
<%# Comma-separated links %>
<%= it.genres.link() %>

<%# Pipe-separated links %>
<%= it.genres.link().join(" | ") %>

<%# As tags %>
<%= it.genres.map(g => "#" + g.replace(/ /g, "-")).join(" ") %>
```

### Top Cast with Roles

```eta
## Cast

<%= it.castWithRoles.top(5).linkActors().bullet() %>
```

Output:
```
## Cast

- [[Marlon Brando]] as Don Vito Corleone
- [[Al Pacino]] as Michael Corleone
- [[James Caan]] as Sonny Corleone
- [[Robert Duvall]] as Tom Hagen
- [[Richard S. Castellano]] as Clemenza
```

### Directors Section

```eta
<% if (!it.directors.isEmpty()) { %>
**Director<%= it.directors.toNative().length > 1 ? "s" : "" %>**: <%= it.directors.link() %>
<% } %>
```

### External Links

```eta
---
[Letterboxd](<%= it.link %>)<% if (!it.tmdbId.isEmpty()) { %> | [TMDB](https://www.themoviedb.org/movie/<%= it.tmdbId %>)<% } %>
```

For Film notes with IMDb:

```eta
[TMDB](<%= it.tmdbUrl %>)<% if (!it.imdbId.isEmpty()) { %> | [IMDb](https://www.imdb.com/title/<%= it.imdbId %>)<% } %>
```

### Frontmatter with All Metadata

Complete diary note frontmatter:

```eta
---
film: "[[<%= it.filmTitle %>]]"
year: <%= it.filmYear %>
rating: <%= it.userRating.over(10) %>
stars: <%= it.userRating.stars().yaml() %>
watched: <%= it.watchedDate %>
rewatch: <%= it.rewatch %>
spoilers: <%= it.containsSpoilers %>
url: <%= it.link.yaml() %>
tmdb_id: <%= it.tmdbId %>
poster: <%= it.posterUrl.yaml() %>
guid: <%= it.guid %>
tags: <%= it.tags.yaml() %>
---
```

Complete Film note frontmatter:

```eta
---
title: <%= it.title.yaml() %>
original_title: <%= it.originalTitle.yaml() %>
year: <%= it.year %>
release_date: <%= it.releaseDate %>
runtime: <%= it.runtime %>
runtime_formatted: <%= it.runtimeFormatted.yaml() %>
tmdb_id: <%= it.tmdbId %>
imdb_id: <%= it.imdbId.yaml() %>
tmdb_rating: <%= it.tmdbRating %>
genres: <%= it.genres.yaml() %>
directors: <%= it.directors.link().yaml() %>
cast: <%= it.cast.top(10).link().yaml() %>
collection: <%= it.collection.yaml() %>
budget: <%= it.budget %>
revenue: <%= it.revenue %>
poster: <%= it.poster.size("L").yaml() %>
backdrop: <%= it.backdrop.size("L").yaml() %>
---
```

### Compact Film Card

A minimal template for quick reference:

```eta
# <%= it.title %> (<%= it.year %>)

<% if (!it.poster.isEmpty()) { %>![Poster](<%= it.poster.size("M") %>)
<% } %>
<%= it.tagline.italic() %>

**Runtime**: <%= it.runtimeFormatted %> | **Rating**: <%= it.tmdbRating.fixed(1) %>/10
**Genres**: <%= it.genres.link() %>
**Director**: <%= it.directors.link() %>
```

### Dataview-Compatible Frontmatter

For use with the Dataview plugin:

```eta
---
type: film
title: <%= it.title.yaml() %>
year: <%= it.year %>
watched: <%= it.watchedDate %>
rating: <%= it.userRating.over(10) %>
genres: <%= it.genres.yaml() %>
directors: <%= it.directors.yaml() %>
---
```

---

## Default Templates

### Default Diary Note Template

```eta
---
film: "[[<%= it.filmTitle %> (<%= it.filmYear %>)]]"
rating: <%= it.userRating.over(10) %>
watched_date: <%= it.watchedDate %>
letterboxd_url: <%= it.link.yaml() %>
tmdb_id: <%= it.tmdbId %>
poster: <%= it.posterUrl.yaml() %>
letterboxd_guid: <%= it.guid %>
letterboxd_tags: <%= it.tags.yaml() %>
---

# [[<%= it.filmTitle %> (<%= it.filmYear %>)]]

<% if (!it.posterUrl.isEmpty()) { %>![Poster](<%= it.posterUrl %>)
<% } %>
**Rating**: <%= it.userRating.stars() %>
**Watched**: <%= it.watchedDate %><% if (it.rewatch.isTrue()) { %> (rewatch)<% } %>

<% if (!it.review.isEmpty()) { %><%= it.review.quote() %>
<% } %>
---
[View on Letterboxd](<%= it.link %>)
```

### Default Film Note Template

```eta
---
title: <%= it.title.yaml() %>
original_title: <%= it.originalTitle.yaml() %>
year: <%= it.year %>
release_date: <%= it.releaseDate %>
runtime: <%= it.runtime %>
tmdb_id: <%= it.tmdbId %>
imdb_id: <%= it.imdbId.yaml() %>
tmdb_rating: <%= it.tmdbRating %>
genres: <%= it.genres.yaml() %>
directors: <%= it.directors.link().yaml() %>
cast: <%= it.cast.link().yaml() %>
poster: <%= it.poster.size("L").yaml() %>
---

# <%= it.title %> (<%= it.year %>)

<% if (!it.poster.isEmpty()) { %>![Poster](<%= it.poster.size("L") %>)
<% } %>
<% if (!it.tagline.isEmpty()) { %><%= it.tagline.bold().quote() %>
<% } %><% if (!it.overview.isEmpty()) { %><%= it.overview.quote() %>
<% } %>
**Runtime**: <%= it.runtimeFormatted %>
**Genres**: <%= it.genres %>

## Cast

<%= it.castWithRoles.linkActors().bullet() %>

---
[TMDB](<%= it.tmdbUrl %>)<% if (!it.imdbId.isEmpty()) { %> | [IMDb](https://imdb.com/title/<%= it.imdbId %>)<% } %>
```
