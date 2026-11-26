"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const LIVE_CHANGE = "sap-live-change";

/** Tell every useApi() list on the page that the user's data changed. */
export function notifyChange() {
  window.dispatchEvent(new Event(LIVE_CHANGE));
}

/** Load a backend resource; `auth` sends the session. Returns reload(). */
export function useApi<T>(path: string | null, auth = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!path);

  const reload = useCallback(async () => {
    if (!path) return null;
    setLoading(true);
    try {
      const result = await api<T>(path, { auth });
      setData(result);
      setError("");
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [path, auth]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Any change made elsewhere on the page (start a trial, add to cart…)
  // refreshes every signed-in list and count.
  useEffect(() => {
    if (!path || !auth) return;
    const onChange = () => {
      reload();
    };
    window.addEventListener(LIVE_CHANGE, onChange);
    return () => window.removeEventListener(LIVE_CHANGE, onChange);
  }, [path, auth, reload]);

  return { data, error, loading, reload, setData };
}

export type CatalogItem = {
  id: string;
  kind: string;
  title: string;
  description: string;
  category: string;
  url: string;
  image_url: string;
  price: number;
  badge: string;
  meta: Record<string, unknown>;
  sort: number;
  active: boolean;
};

export type Summary = {
  interests: string[];
  trials: { active: number; recommended: number };
  learnings: { courses: number; tutorials: number; completed: number };
  events: { registered: number; recommended: number };
  demos: number;
  whats_new: number;
  newsletters: number;
  saved: number;
  recent: number;
  marketing: number;
  unread: number;
  messages: number;
  cart: number;
  orders: number;
};

export function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
