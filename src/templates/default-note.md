---
film: "[[{{filmTitle}}]]"
rating: {{userRatingNoOver5}}
watched_date: {{watchedDate}}
letterboxd_url: "{{link}}"
tmdb_id: {{tmdbId}}
poster: "{{posterUrl}}"
letterboxd_guid: {{guid}}
letterboxd_tags: {{tags}}
---

# [[{{filmTitle}}]] ({{filmYear}})

![]({{posterUrl}})

**Rating**: {{userRatingStars}}
**Watched**: {{watchedDate}}{{#if rewatch}} (rewatch){{/if}}

> {{review}}

---
[View on Letterboxd]({{link}})
