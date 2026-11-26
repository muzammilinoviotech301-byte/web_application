import postcss from "postcss";

// Captured page bodies are wrapped as
//   <div class="captured-body {page body classes}">
//     <div class="captured-main {page main classes}"> ...main content... </div>
//   </div>
// and every captured stylesheet is rewritten so `body` / `main` selectors hit
// those stand-ins and every other rule only matches inside .captured-body.
// This keeps SAP's page CSS (including the Edge Delivery blog/resource pages,
// which style bare header/footer/main elements) out of the clone's own header
// and footer, while matching the page structure the CSS expects.
//
// The scope is attached to the selector's first compound:
//   .hub-l2.has-sidenav .hlx-main
//     -> .hub-l2.has-sidenav:is(.captured-body, .captured-body *) .hlx-main
// so it matches whether that element is the wrapper itself (page body
// classes live there) or anything inside it.

export const SCOPED_MARK = "/* scoped-for-clone v2 */";
const LEGACY_MARK = "/* scoped-for-clone */";
const BODY = ".captured-body";
const MAIN = ".captured-main";
const SCOPE = `:is(${BODY}, ${BODY} *)`;
const TOKEN_END = "(?=[\\s.#:[>+~),]|$)";
const MAIN_RE = new RegExp(`(^|[\\s>+~(,])main${TOKEN_END}`, "g");
const BODY_RE = new RegExp(`(^|[\\s>+~(,])body${TOKEN_END}`, "g");

// Index where the first compound selector ends (first top-level combinator).
function firstCompoundEnd(sel) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < sel.length; i += 1) {
    const ch = sel[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    else if (depth === 0 && /[\s>+~]/.test(ch)) return i;
  }
  return sel.length;
}

export function scopeSelector(selector) {
  let s = selector.trim();
  if (!s) return s;
  s = s.replace(MAIN_RE, `$1${MAIN}`);
  if (/^(:root|html)\b/.test(s)) return s.replace(BODY_RE, `$1${BODY}`);
  if (/^body(?=[\s.#:[>+~]|$)/.test(s)) return BODY + s.slice(4);
  if (s.startsWith(BODY) || s.startsWith(MAIN)) return s;
  const end = firstCompoundEnd(s);
  const first = s.slice(0, end);
  const rest = s.slice(end);
  // Keep pseudo-elements last in the compound (::before etc.).
  const pseudoAt = first.search(/::/);
  const head = pseudoAt === -1 ? first : first.slice(0, pseudoAt);
  const tail = pseudoAt === -1 ? "" : first.slice(pseudoAt);
  return `${head}${SCOPE}${tail}${rest}`;
}

// Undo the v1 scoping (a ".captured-body " prefix) so v2 can be applied.
function unscopeLegacy(selector) {
  return selector.startsWith(`${BODY} `) ? selector.slice(BODY.length + 1) : selector;
}

// Reverse scopeCss (v2): drop the mark and every inserted scope.
export function unscopeCss(css) {
  if (!css.startsWith(SCOPED_MARK)) return css;
  return css.slice(SCOPED_MARK.length).replace(/^\n/, "").split(SCOPE).join("");
}

export function scopeCss(css) {
  if (css.startsWith(SCOPED_MARK)) return css;
  let source = css;
  let legacy = false;
  if (source.startsWith(LEGACY_MARK)) {
    source = source.slice(LEGACY_MARK.length).replace(/^\n/, "");
    legacy = true;
  }
  let root;
  try {
    root = postcss.parse(source);
  } catch {
    return css; // unparsable: leave as-is rather than break it
  }
  root.walkRules((rule) => {
    const parent = rule.parent;
    if (parent?.type === "atrule" && /keyframes$/i.test(parent.name)) return;
    rule.selectors = rule.selectors.map((sel) => scopeSelector(legacy ? unscopeLegacy(sel) : sel));
  });
  return `${SCOPED_MARK}\n${root.toString()}`;
}
