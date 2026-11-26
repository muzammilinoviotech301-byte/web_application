// Client for the FastAPI backend (backend/), which talks to Supabase.
// The session (Supabase access + refresh token) lives in localStorage when
// "Keep me signed in" is ticked, otherwise in sessionStorage (cleared when
// the browser closes) — the same behaviour as SAP ID.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
  /\/$/,
  ""
);

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number | null; // seconds since epoch
};

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  company: string;
  country: string;
  department: string;
  relationship: string;
  phone: string;
  contact_by_email: boolean;
  contact_by_phone: boolean;
  terms_accepted_at: string | null;
};

const SESSION_KEY = "sap-clone-session";
export const SESSION_EVENT = "sap-session-change";

function stores(): Storage[] {
  if (typeof window === "undefined") return [];
  const list: Storage[] = [];
  try { list.push(window.localStorage); } catch {}
  try { list.push(window.sessionStorage); } catch {}
  return list;
}

export function readSession(): Session | null {
  for (const store of stores()) {
    try {
      const raw = store.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw) as Session;
    } catch {}
  }
  return null;
}

function persistent(): boolean {
  try {
    return !!window.localStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

export function saveSession(session: Session, keepSignedIn = persistent()) {
  if (typeof window === "undefined") return;
  const value = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? null,
  });
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    (keepSignedIn ? window.localStorage : window.sessionStorage).setItem(SESSION_KEY, value);
  } catch {}
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  for (const store of stores()) {
    try { store.removeItem(SESSION_KEY); } catch {}
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/** Supabase e-mail links return with the session in the URL hash. */
export function sessionFromHash(hash: string): (Session & { type: string }) | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const access = params.get("access_token");
  const refresh = params.get("refresh_token");
  if (!access || !refresh) return null;
  return {
    access_token: access,
    refresh_token: refresh,
    expires_at: Number(params.get("expires_at")) || null,
    type: params.get("type") || "",
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    const detail = data?.detail;
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail) && detail[0]?.msg) message = String(detail[0].msg).replace(/^Value error, /, "");
    throw new ApiError(message, response.status);
  }
  return data;
}

let refreshing: Promise<Session | null> | null = null;

async function refreshSession(session: Session): Promise<Session | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const next = (await parse(
          await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: session.refresh_token }),
          })
        )) as Session;
        saveSession(next);
        return next;
      } catch {
        clearSession();
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

/** Call the backend. `auth: true` sends the session (refreshing it first if
 *  it is about to expire, and once more on a 401). */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; session?: Session } = {}
): Promise<T> {
  const { method = options.body !== undefined ? "POST" : "GET", body, auth = false } = options;
  let session = options.session ?? (auth ? readSession() : null);
  if (auth && !session) throw new ApiError("You are not signed in.", 401);
  if (session && session.expires_at && session.expires_at * 1000 - Date.now() < 60_000 && !options.session) {
    session = await refreshSession(session);
    if (!session) throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  const send = (current: Session | null) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(current ? { Authorization: `Bearer ${current.access_token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response: Response;
  try {
    response = await send(session);
  } catch {
    throw new ApiError("Can't reach the SAP clone server. Is the backend running on port 8000?", 0);
  }
  if (response.status === 401 && session && !options.session) {
    const next = await refreshSession(session);
    if (next) response = await send(next);
  }
  return parse(response) as Promise<T>;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
