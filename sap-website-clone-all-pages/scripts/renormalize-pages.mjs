import { renormalizeStore } from "./lib/page-store.mjs";

// Re-applies the HTML normalization rules (links, lazy-image activation) to
// every page already in content/pages. Run after changing normalizeHtml.
//
// Usage: npm run renormalize:pages

const changed = renormalizeStore();
console.log(`Updated ${changed} page bodies.`);
