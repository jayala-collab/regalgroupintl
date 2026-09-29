/* Regal loan portal — API endpoint. Local preview (port 8137) talks to `wrangler dev` on 8787. */
window.REGAL_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "http://localhost:8787"
  : "https://regal-portal.j-ayala.workers.dev";
