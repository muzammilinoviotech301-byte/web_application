// In-page capture runner for live sap.com pages (paste into a tab already
// showing any www.sap.com page). Pages load one at a time in a hidden,
// same-origin 1440x900 iframe, at roughly one page per 8-10s, and the run
// stops immediately if SAP answers "Access Denied".
//
// The queue lives in that tab's localStorage ("__cloneLeft"), and pasting
// this file also stores the runner itself there, so after a reload (to free
// memory) the tab resumes with:
//   (0, eval)(localStorage.getItem("__cloneRunner")); window.__run();
//
//   window.__enq(["local/slug", ...]); // add pages (fetched from
//                                      // https://www.sap.com/<slug>.html) and run
//   window.__drain();                  // returns finished captures (large: the
//                                      // browser tool saves it to a file for ingest)
//
// Each capture: { slug, url, title, description, main (rendered <main>, with
// web-component shadow DOM as <template shadowrootmode>), beforeMain (bars
// between masthead and main), extras (page rating), bodyClass, mainClass,
// sheets/css/sheetUrls (page stylesheets), shadowCss (component stylesheets),
// docSheets/docCss (<style> tags + adopted sheets), pageNotFound }.
// Import with: node scripts/ingest-live-capture.mjs <saved-output-file>
function __cloneRunner() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fnv = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  };
  window.__results = []; window.__status = "idle";
  const QKEY = "__cloneLeft";
  const getQ = () => { try { return JSON.parse(localStorage.getItem(QKEY) || "[]"); } catch { return []; } };
  const setQ = (q) => localStorage.setItem(QKEY, JSON.stringify(q));
  window.__enq = (slugs) => {
    const q = getQ(); const have = new Set(q);
    for (const s of slugs) if (!have.has(s)) { q.push(s); have.add(s); }
    setQ(q); window.__run(); return `queued ${q.length}`;
  };
  window.__seenCss = new Set(); window.__sheetNames = new WeakMap();

  // Serialize an element including (nested) shadow roots. Each adopted
  // stylesheet becomes a shared /captured/styles/live/shadow-<hash>.css link.
  const serialize = (el, outer, shadowCss) => {
    const roots = []; const added = [];
    const walk = (n) => { for (const c of n.querySelectorAll("*")) if (c.shadowRoot) { roots.push(c.shadowRoot); walk(c.shadowRoot); } };
    if (el.shadowRoot) { roots.push(el.shadowRoot); walk(el.shadowRoot); }
    walk(el);
    for (const r of roots) {
      for (const sh of [...(r.adoptedStyleSheets || [])].reverse()) {
        let name = window.__sheetNames.get(sh);
        if (!name) {
          let css = ""; try { css = [...sh.cssRules].map((x) => x.cssText).join("\n"); } catch {}
          if (!css) continue;
          name = `shadow-${fnv(css)}.css`; window.__sheetNames.set(sh, name); shadowCss[name] = css;
        }
        const l = el.ownerDocument.createElement("link"); l.rel = "stylesheet"; l.href = `/captured/styles/live/${name}`;
        r.prepend(l); added.push(l);
      }
    }
    let html; try { html = el.getHTML({ shadowRoots: roots }); } finally { added.forEach((s) => s.remove()); }
    if (!outer) return html;
    const tag = el.tagName.toLowerCase();
    return el.cloneNode(false).outerHTML.replace(new RegExp(`</${tag}>$`), `${html}</${tag}>`);
  };

  const capOne = async (fr, slug, url) => {
    await new Promise((res) => { fr.onload = res; fr.src = url; setTimeout(res, 20000); });
    await sleep(2500);
    const w = fr.contentWindow; const d = fr.contentDocument;
    if (!d || /Access Denied/i.test(d.title)) return { slug, error: "denied" };
    for (let y = 0; y < d.documentElement.scrollHeight; y += 600) { w.scrollTo(0, y); await sleep(220); }
    w.scrollTo(0, d.documentElement.scrollHeight); await sleep(1200); w.scrollTo(0, 0); await sleep(400);
    const main = d.querySelector("main");
    if (!main) return { slug, error: `nomain:${d.title}` };
    const shadowCss = {};
    const mainHtml = serialize(main, false, shadowCss).replace(/<script\b[\s\S]*?<\/script>|<noscript\b[\s\S]*?<\/noscript>/gi, "");
    const before = [];
    for (const e of d.body.children) {
      if (e === main || e.contains(main)) break;
      if (e.matches("header,script,noscript,style,link") || e.getBoundingClientRect().height === 0) continue;
      before.push(serialize(e, true, shadowCss));
    }
    const rating = d.querySelector('[data-component="PageRating"]');
    const extras = rating && !main.contains(rating) ? rating.outerHTML : "";
    const sheets = []; const css = {}; const sheetUrls = {};
    for (const link of d.querySelectorAll('link[rel="stylesheet"][href]')) {
      const u = new URL(link.href);
      if (u.origin !== location.origin) continue;
      const name = u.pathname.split("/").pop();
      if (sheets.includes(name)) continue;
      sheets.push(name); sheetUrls[name] = u.href;
      if (!window.__seenCss.has(name)) { try { css[name] = await (await fetch(u.href)).text(); window.__seenCss.add(name); } catch {} }
    }
    // Document-level styles: <style> tags plus adopted sheets, each saved once
    // as doc-<hash>.css (UI5 theme variables, fonts, Stencil component CSS).
    const docSheets = []; const docCss = {};
    const docTexts = [...d.querySelectorAll("style")].map((s) => s.textContent);
    for (const sh of d.adoptedStyleSheets || []) { try { docTexts.push([...sh.cssRules].map((x) => x.cssText).join("\n")); } catch {} }
    for (const text of docTexts) {
      if (!text || !text.trim()) continue;
      const name = `doc-${fnv(text)}.css`;
      if (docSheets.includes(name)) continue;
      docSheets.push(name);
      if (!window.__seenCss.has(name)) { docCss[name] = text; window.__seenCss.add(name); }
    }
    const meta = (n) => d.querySelector(`meta[name="${n}"]`)?.content || "";
    return {
      slug, url: w.location.href, title: d.title, description: meta("description"),
      main: mainHtml, beforeMain: before.join("\n"), extras,
      bodyClass: d.body.className, mainClass: main.className,
      sheets, css, sheetUrls, shadowCss, docSheets, docCss,
      pageNotFound: /not found|404/i.test(d.title),
    };
  };

  // Sandboxed (no top navigation, so a redirecting page can't replace this
  // tab) and recreated every 5 pages so a long run doesn't exhaust memory.
  const makeFrame = () => {
    const f = document.createElement("iframe");
    f.sandbox = "allow-scripts allow-same-origin allow-forms allow-popups";
    f.style.cssText = "position:fixed;left:0;top:0;width:1440px;height:900px;opacity:0;pointer-events:none;z-index:-1;border:0";
    document.body.appendChild(f);
    return f;
  };

  window.__run = async () => {
    if (window.__status === "running") return;
    window.__status = "running";
    let fr = makeFrame();
    let n = 0;
    while (getQ().length) {
      // Pause (keeping the queue) when the tab's heap gets large: drain, then
      // reload the tab and resume.
      if (performance.memory && performance.memory.usedJSHeapSize > 2.2e9) { window.__status = "paused-memory"; break; }
      if (++n % 5 === 0) { fr.remove(); await sleep(500); fr = makeFrame(); }
      // A short pause between pages keeps the load on sap.com low (SAP's bot
      // protection answered "Access Denied" once at full speed).
      await sleep(4000);
      const slug = getQ()[0];
      window.__current = slug;
      try {
        const r = await capOne(fr, slug, `https://www.sap.com/${slug}.html`);
        window.__results.push(r);
        // Respect SAP's bot protection: stop the whole run on a denial.
        if (r.error === "denied") { window.__status = "denied"; break; }
      } catch (e) { window.__results.push({ slug, error: String(e) }); }
      setQ(getQ().filter((x) => x !== slug));
    }
    fr.remove(); window.__current = null;
    if (window.__status === "running") window.__status = "idle";
  };

  window.__drain = () => {
    const r = window.__results.splice(0);
    const summary = r.map((x) => `${x.slug}:${x.error || (x.main || "").length + (x.pageNotFound ? " NOTFOUND" : "")}`).join(" | ");
    return `${summary}\nqueue=${getQ().length} status=${window.__status}\n` +
      r.filter((x) => !x.error).map((x) => `LIVECAPTURE_START${JSON.stringify(x)}LIVECAPTURE_END`).join("") + "#".repeat(130000);
  };
  return "capture runner ready";
}
localStorage.setItem("__cloneRunner", `(${__cloneRunner})()`);
__cloneRunner();
