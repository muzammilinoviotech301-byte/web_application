"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Captured SAP pages serialize web-component shadow DOM as declarative
// <template shadowrootmode="open"> elements. The browser's HTML parser turns
// those into real shadow roots on a full page load, but content inserted
// later (client-side navigation sets innerHTML, or the page body streams in
// after this effect ran) keeps them inert. Attach leftover templates after
// each navigation and whenever new content lands in <main>.
export default function ShadowRootHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    // Templates for nested components sit inside their parent's shadow root,
    // so recurse into each root once it's attached.
    const attach = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLTemplateElement>("template[shadowrootmode]").forEach((template) => {
        const host = template.parentElement;
        if (!host) return;
        if (!host.shadowRoot) {
          const mode = template.getAttribute("shadowrootmode") === "closed" ? "closed" : "open";
          try {
            host.attachShadow({ mode }).appendChild(template.content.cloneNode(true));
          } catch {
            return; // this element can't host a shadow root
          }
        }
        template.remove();
        if (host.shadowRoot) attach(host.shadowRoot);
      });
    };
    const main = document.querySelector("main");
    if (!main) return;
    attach(main);
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        attach(main);
      });
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
