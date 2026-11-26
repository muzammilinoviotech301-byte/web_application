"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FEATURE_NOTICES } from "@/components/FeatureNotice";
import { ACCOUNT_PAGES, getAccountPage, type AccountPageKey } from "@/data/account-pages";
import { api } from "@/lib/api";
import { formatDate, formatMoney, useApi, type CatalogItem } from "@/lib/use-api";

const KINDS: { value: string; label: string; hint: string }[] = [
  { value: "trial", label: "Free trials", hint: "Shown on Free trials and the dashboard. Users can start them." },
  { value: "learning", label: "Learning", hint: "Courses and tutorials users can enroll in. Set meta.kind to course, tutorial or journey." },
  { value: "event", label: "Events", hint: "Users can register. meta.location / meta.date are shown on the card." },
  { value: "demo", label: "Demos", hint: "Links to demos and product tours." },
  { value: "newsletter", label: "Newsletters", hint: "Categories users can subscribe to." },
  { value: "product", label: "Store products", hint: "Products users can add to the shopping cart (demo checkout). meta.plan shows the billing plan." },
  { value: "product_login", label: "Product logins", hint: "Category must be ariba, concur, fieldglass or successfactors. URL may contain {companyId}." },
  { value: "whats_new", label: "What's new", hint: "Items on the dashboard's What's new page." },
];

type Tab = "overview" | "catalog" | "messages" | "content" | "admins";

const FEATURES: [string, "Live" | "Alternative", string][] = [
  ["Register, verify e-mail, sign in, sign out, reset password", "Live", "Supabase Auth via FastAPI"],
  ["Profile, company, contact preferences, password change", "Live", "Stored in profiles"],
  ["Interests, marketing choices, e-mail preferences, newsletters", "Live", "Stored per user"],
  ["Free trials, learning, events (start / enroll / register)", "Live", "Catalog below + user tables"],
  ["Saved items, recently viewed", "Live", "Saved per user"],
  ["Inbox (personal + messages from admins)", "Live", "Messages tab"],
  ["Shopping cart and orders", "Alternative", "Demo checkout, no payment (SAP Store isn't available)"],
  ["SAP trial systems, SAP Learning courses", "Alternative", "Admin-managed catalog entries"],
  ["Ariba, Concur, Fieldglass, SuccessFactors sign-on", "Alternative", "Opens each product's own login page"],
  ["Multi-factor auth, certificates, access tokens, social sign-on", "Alternative", "Editable notices (Page content → feature:…)"],
  ["Sessions on other devices", "Alternative", "'Sign out of all sessions' revokes them all"],
  ["reCAPTCHA on registration", "Alternative", "Needs Google reCAPTCHA keys; text only"],
  ["What's new / content recommendations feeds", "Alternative", "Admin-managed catalog and page text"],
];

function useStatus() {
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  return {
    text,
    error,
    ok: (message: string) => {
      setError(false);
      setText(message);
    },
    fail: (err: unknown) => {
      setError(true);
      setText((err as Error).message);
    },
    clear: () => setText(""),
  };
}

function Status({ text, error }: { text: string; error: boolean }) {
  if (!text) return null;
  return (
    <p className={`admin-status${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
const EMPTY: Omit<CatalogItem, "id"> = {
  kind: "trial",
  title: "",
  description: "",
  category: "",
  url: "",
  image_url: "",
  price: 0,
  badge: "",
  meta: {},
  sort: 0,
  active: true,
};

function CatalogTab() {
  const catalog = useApi<CatalogItem[]>("/admin/catalog");
  const status = useStatus();
  const [kind, setKind] = useState("trial");
  const [editing, setEditing] = useState<(Omit<CatalogItem, "id"> & { id?: string }) | null>(null);
  const [metaText, setMetaText] = useState("{}");

  const rows = (catalog.data ?? []).filter((row) => row.kind === kind);
  const hint = KINDS.find((k) => k.value === kind)?.hint;

  function edit(item?: CatalogItem) {
    const value = item ?? { ...EMPTY, kind, sort: rows.length + 1 };
    setEditing(value);
    setMetaText(JSON.stringify(value.meta ?? {}, null, 2));
    status.clear();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    let meta: Record<string, unknown>;
    try {
      meta = JSON.parse(metaText || "{}");
    } catch {
      status.fail(new Error("Extra fields (meta) must be valid JSON, e.g. {\"plan\": \"Monthly\"}."));
      return;
    }
    const { id, ...rest } = editing;
    const body = { ...rest, meta, price: Number(rest.price) || 0, sort: Number(rest.sort) || 0 };
    delete (body as Record<string, unknown>).created_at;
    delete (body as Record<string, unknown>).updated_at;
    try {
      if (id) await api(`/admin/catalog/${id}`, { method: "PATCH", auth: true, body });
      else await api("/admin/catalog", { auth: true, body });
      await catalog.reload();
      setEditing(null);
      status.ok("Saved. The change is live on the site.");
    } catch (err) {
      status.fail(err);
    }
  }

  async function remove(item: CatalogItem) {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    try {
      await api(`/admin/catalog/${item.id}`, { method: "DELETE", auth: true });
      await catalog.reload();
      status.ok("Deleted.");
    } catch (err) {
      status.fail(err);
    }
  }

  async function toggle(item: CatalogItem) {
    try {
      await api(`/admin/catalog/${item.id}`, { method: "PATCH", auth: true, body: { active: !item.active } });
      await catalog.reload();
    } catch (err) {
      status.fail(err);
    }
  }

  const field = (key: keyof Omit<CatalogItem, "id" | "meta" | "active">, label: string, type = "text", wide = false) => (
    <label className={`admin-field${wide ? " admin-field-wide" : ""}`}>
      <span>{label}</span>
      {key === "description" ? (
        <textarea rows={3} value={String(editing?.[key] ?? "")} onChange={(e) => setEditing((c) => c && { ...c, [key]: e.target.value })} />
      ) : (
        <input type={type} value={String(editing?.[key] ?? "")} onChange={(e) => setEditing((c) => c && { ...c, [key]: e.target.value })} />
      )}
    </label>
  );

  return (
    <div>
      <div className="admin-kinds" role="tablist" aria-label="Catalog type">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={kind === k.value}
            className={kind === k.value ? "is-active" : ""}
            onClick={() => {
              setKind(k.value);
              setEditing(null);
            }}
          >
            {k.label} <span>{(catalog.data ?? []).filter((r) => r.kind === k.value).length}</span>
          </button>
        ))}
      </div>
      {hint && <p className="admin-hint">{hint}</p>}

      <div className="admin-actions">
        <button type="button" className="sapreg-button" onClick={() => edit()}>
          Add item
        </button>
      </div>

      {editing && (
        <form className="admin-form" onSubmit={save}>
          <h3>{editing.id ? "Edit item" : "New item"}</h3>
          <div className="admin-grid">
            {field("title", "Title *", "text", true)}
            {field("description", "Description", "text", true)}
            {field("category", kind === "product_login" ? "Product key (ariba, concur…)" : "Category")}
            {field("badge", "Badge / label")}
            {field("url", kind === "product_login" ? "Login URL ({companyId} allowed)" : "Link URL", "text", true)}
            {field("image_url", "Image URL", "text", true)}
            {kind === "product" && field("price", "Price (USD)", "number")}
            {field("sort", "Order", "number")}
            <label className="admin-field admin-check">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing((c) => c && { ...c, active: e.target.checked })} />
              <span>Visible on the site</span>
            </label>
            <label className="admin-field admin-field-wide">
              <span>Extra fields (JSON)</span>
              <textarea rows={4} className="admin-code" value={metaText} onChange={(e) => setMetaText(e.target.value)} />
            </label>
          </div>
          <div className="admin-actions">
            <button type="submit" className="sapreg-button">
              Save
            </button>
            <button type="button" className="sapreg-button sapreg-button-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <Status text={status.text} error={status.error} />

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>{kind === "product" ? "Price" : "Badge"}</th>
              <th>Visible</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.active ? "" : "is-hidden"}>
                <td>
                  <strong>{row.title}</strong>
                  <small>{row.description}</small>
                </td>
                <td>{row.category}</td>
                <td>{kind === "product" ? formatMoney(row.price) : row.badge}</td>
                <td>
                  <button type="button" className="admin-link" onClick={() => toggle(row)}>
                    {row.active ? "Yes" : "No"}
                  </button>
                </td>
                <td className="admin-row-actions">
                  <button type="button" className="admin-link" onClick={() => edit(row)}>
                    Edit
                  </button>
                  <button type="button" className="admin-link admin-danger" onClick={() => remove(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={5}>{catalog.loading ? "Loading…" : "No items yet."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Broadcast messages
// ---------------------------------------------------------------------------
type Broadcast = { id: string; subject: string; sender: string; body: string; active: boolean; created_at: string };

function MessagesTab() {
  const messages = useApi<Broadcast[]>("/admin/broadcasts");
  const status = useStatus();
  const [draft, setDraft] = useState({ subject: "", sender: "SAP", body: "" });

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await api("/admin/broadcasts", { auth: true, body: draft });
      setDraft({ subject: "", sender: "SAP", body: "" });
      await messages.reload();
      status.ok("Sent. Every user now sees it in their Inbox.");
    } catch (err) {
      status.fail(err);
    }
  }

  return (
    <div>
      <form className="admin-form" onSubmit={send}>
        <h3>Send a message to every user&apos;s Inbox</h3>
        <div className="admin-grid">
          <label className="admin-field admin-field-wide">
            <span>Subject *</span>
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} required />
          </label>
          <label className="admin-field">
            <span>From</span>
            <input value={draft.sender} onChange={(e) => setDraft({ ...draft, sender: e.target.value })} />
          </label>
          <label className="admin-field admin-field-wide">
            <span>Message</span>
            <textarea rows={5} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
        </div>
        <div className="admin-actions">
          <button type="submit" className="sapreg-button">
            Send
          </button>
        </div>
      </form>
      <Status text={status.text} error={status.error} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>From</th>
              <th>Sent</th>
              <th>Visible</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(messages.data ?? []).map((row) => (
              <tr key={row.id} className={row.active ? "" : "is-hidden"}>
                <td>
                  <strong>{row.subject}</strong>
                  <small>{row.body}</small>
                </td>
                <td>{row.sender}</td>
                <td>{formatDate(row.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="admin-link"
                    onClick={async () => {
                      try {
                        await api(`/admin/broadcasts/${row.id}`, { method: "PATCH", auth: true, body: { active: !row.active } });
                        await messages.reload();
                      } catch (err) {
                        status.fail(err);
                      }
                    }}
                  >
                    {row.active ? "Yes" : "No"}
                  </button>
                </td>
                <td className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-link admin-danger"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${row.subject}" from every inbox?`)) return;
                      try {
                        await api(`/admin/broadcasts/${row.id}`, { method: "DELETE", auth: true });
                        await messages.reload();
                      } catch (err) {
                        status.fail(err);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content: account pages and feature notices
// ---------------------------------------------------------------------------
function ContentTab() {
  const keys = useMemo(
    () => [
      ...Object.keys(ACCOUNT_PAGES).map((key) => ({ key: `account:${key}`, label: `Page: ${getAccountPage(key as AccountPageKey).title.replace("{name}", "Dashboard")} (${key})` })),
      ...Object.keys(FEATURE_NOTICES).map((key) => ({ key: `feature:${key}`, label: `Notice: ${FEATURE_NOTICES[key].title}` })),
    ],
    []
  );
  const all = useApi<Record<string, Record<string, unknown>>>("/content", false);
  const status = useStatus();
  const [key, setKey] = useState(keys[0].key);
  const [text, setText] = useState("");

  const defaults = useMemo(() => {
    if (key.startsWith("account:")) {
      const page = getAccountPage(key.slice(8) as AccountPageKey);
      return { eyebrow: page.eyebrow, title: page.title, subtitle: page.subtitle, sections: page.sections };
    }
    return FEATURE_NOTICES[key.slice(8)];
  }, [key]);

  useEffect(() => {
    const saved = all.data?.[key];
    setText(JSON.stringify(saved && Object.keys(saved).length ? { ...defaults, ...saved } : defaults, null, 2));
    status.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, all.data, defaults]);

  async function save() {
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      status.fail(new Error("The content must be valid JSON."));
      return;
    }
    try {
      await api(`/admin/content/${encodeURIComponent(key)}`, { method: "PUT", auth: true, body: { data } });
      await all.reload();
      status.ok("Saved. Reload the page on the site to see it.");
    } catch (err) {
      status.fail(err);
    }
  }

  async function reset() {
    if (!window.confirm("Restore the original content for this page?")) return;
    try {
      await api(`/admin/content/${encodeURIComponent(key)}`, { method: "DELETE", auth: true });
      await all.reload();
      status.ok("Restored the original content.");
    } catch (err) {
      status.fail(err);
    }
  }

  const edited = !!all.data?.[key];
  const pagePath = key.startsWith("account:") ? key.slice(8) : null;
  return (
    <div>
      <p className="admin-hint">
        Edit the text of any account page or feature notice. Pages keep their live data (trials, cart, inbox…); this
        changes headings, descriptions, cards and links. Use <code>{"{name}"}</code>, <code>{"{email}"}</code>,{" "}
        <code>{"{company}"}</code> to insert the user&apos;s details.
      </p>
      <div className="admin-grid">
        <label className="admin-field admin-field-wide">
          <span>Content</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {keys.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
                {all.data?.[k.key] ? " — edited" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field admin-field-wide">
          <span>JSON {edited ? "(edited)" : "(original)"}</span>
          <textarea rows={22} className="admin-code" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </label>
      </div>
      <div className="admin-actions">
        <button type="button" className="sapreg-button" onClick={save}>
          Save
        </button>
        {edited && (
          <button type="button" className="sapreg-button sapreg-button-ghost" onClick={reset}>
            Restore original
          </button>
        )}
        {pagePath && (
          <span className="admin-hint">
            Account pages live under <code>/dashboard</code>, <code>/account</code> and similar routes.
          </span>
        )}
      </div>
      <Status text={status.text} error={status.error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admins
// ---------------------------------------------------------------------------
function AdminsTab({ me }: { me: string }) {
  const admins = useApi<{ email: string; created_at: string }[]>("/admin/admins");
  const status = useStatus();
  const [email, setEmail] = useState("");

  return (
    <div>
      <form
        className="admin-form admin-inline"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api("/admin/admins", { auth: true, body: { email } });
            setEmail("");
            await admins.reload();
            status.ok("Added. They get admin access the next time they sign in.");
          } catch (err) {
            status.fail(err);
          }
        }}
      >
        <label className="admin-field">
          <span>Add an admin by e-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button type="submit" className="sapreg-button">
          Add
        </button>
      </form>
      <Status text={status.text} error={status.error} />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Added</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {(admins.data ?? []).map((row) => (
              <tr key={row.email}>
                <td>{row.email}</td>
                <td>{formatDate(row.created_at)}</td>
                <td className="admin-row-actions">
                  {row.email.toLowerCase() !== me.toLowerCase() && (
                    <button
                      type="button"
                      className="admin-link admin-danger"
                      onClick={async () => {
                        try {
                          await api(`/admin/admins/${encodeURIComponent(row.email)}`, { method: "DELETE", auth: true });
                          await admins.reload();
                        } catch (err) {
                          status.fail(err);
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function AdminPanel() {
  const { account, ready } = useAuth();
  const access = useApi<{ is_admin: boolean; email: string }>(account ? "/admin/me" : null);
  const [tab, setTab] = useState<Tab>("overview");

  if (!ready || (account && access.loading && !access.data)) return <div className="account-loading">Loading admin panel…</div>;

  if (!account) {
    return (
      <div className="admin-shell">
        <h1>Admin panel</h1>
        <p>
          Please <Link href="/login?next=%2Fadmin">sign in</Link> with an admin account.
        </p>
      </div>
    );
  }

  if (!access.data?.is_admin) {
    return (
      <div className="admin-shell">
        <h1>Admin panel</h1>
        <p>
          <strong>{account.email}</strong> doesn&apos;t have admin access.
        </p>
        <p className="admin-hint">
          An existing admin can add you under Admins. For the very first admin, run this in the Supabase SQL editor:
        </p>
        <pre className="admin-code-block">{`insert into public.app_admins (email) values ('${account.email}');`}</pre>
      </div>
    );
  }

  const TABS: [Tab, string][] = [
    ["overview", "Overview"],
    ["catalog", "Catalog"],
    ["messages", "Inbox messages"],
    ["content", "Page content"],
    ["admins", "Admins"],
  ];

  return (
    <div className="admin-shell">
      <p className="eyebrow">SAP.com clone</p>
      <h1>Admin panel</h1>
      <div className="admin-tabs" role="tablist">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? "is-active" : ""} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <p className="admin-hint">
            What works for real, and the editable alternatives for features only SAP itself can provide.
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Status</th>
                  <th>How</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map(([feature, state, how]) => (
                  <tr key={feature}>
                    <td>{feature}</td>
                    <td>
                      <span className={`live-status ${state === "Live" ? "live-status-active" : "live-status-recommended"}`}>{state}</span>
                    </td>
                    <td>{how}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "catalog" && <CatalogTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "content" && <ContentTab />}
      {tab === "admins" && <AdminsTab me={access.data.email} />}
    </div>
  );
}
