"use client";

import { useEffect, useRef } from "react";

// SAP's captured pages contain declarative shadow DOM templates and custom
// elements that the browser rewrites while parsing HTML. Rendering that markup
// during SSR makes React hydrate a different tree than the one in the document.
// This route inserts the capture after hydration; ShadowRootHydrator sees the
// mutation and attaches the shadow roots.
export default function ClientCapturedContent({
  html,
  className,
}: {
  html: string;
  className: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
  }, [html]);

  return <div ref={ref} className={className} />;
}
