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
