"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";

// Pages that aren't "content" for the dashboard's Recently viewed list.
const SKIP = /^\/($|login|register|verify-email|forgot-password|reset-password|dashboard|account|admin|inbox|orders|shopping-cart|product-login|profile)/;

/** Records each page a signed-in user opens (Dashboard → Recently viewed). */
export default function RecentTracker() {
  const pathname = usePathname();
  const { account } = useAuth();

  useEffect(() => {
    if (!account || !pathname || SKIP.test(pathname)) return;
    const timer = window.setTimeout(() => {
      const title = document.title.replace(/\s*\|\s*SAP\s*$/i, "").trim() || pathname;
      api("/me/recent", { auth: true, body: { title, url: pathname } }).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [pathname, account]);

  return null;
}
