/* Regal loan portal — API endpoint. Local preview (port 8137) talks to `wrangler dev` on 8787. */
window.REGAL_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "http://localhost:8787"
  : "https://regal-portal.j-ayala.workers.dev";

/* Meta Pixel — same ID as index.html. Fires only a "Lead" event on the post-submit screen. */
window.META_PIXEL_ID = "__REPLACE_WITH_PIXEL_ID__";
