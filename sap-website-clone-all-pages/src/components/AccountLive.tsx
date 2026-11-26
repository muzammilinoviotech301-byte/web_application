"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { formatDate, formatMoney, notifyChange, useApi, type CatalogItem } from "@/lib/use-api";

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="account-section">
      <h2>{title}</h2>
      {description && <p className="account-section-description">{description}</p>}
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="account-panel live-empty">{children}</div>;
}

function Toast({ message, error }: { message: string; error?: boolean }) {
  if (!message) return null;
  return (
    <p className={error ? "account-form-status account-form-error" : "account-form-status"} role={error ? "alert" : "status"}>
      {message}
    </p>
  );
}

function useMessage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  return {
    message,
    error,
    ok: (text: string) => {
      setError(false);
      setMessage(text);
    },
    fail: (err: unknown) => {
      setError(true);
      setMessage((err as Error).message);
    },
  };
}

const isExternal = (url: string) => /^https?:\/\//.test(url);

function ItemLink({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  if (!url) return <span className={className}>{children}</span>;
  return isExternal(url) ? (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link className={className} href={url}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Catalog grids: trials, learning, events, demos, what's new
// ---------------------------------------------------------------------------
type Mine = { id: string; name?: string; title?: string; status: string; kind?: string; created_at: string };

const CATALOG_COPY: Record<string, { mine?: string; action?: string; done?: string; view: string }> = {
  trial: { mine: "/me/trials", action: "Start free trial", done: "Trial active", view: "Learn more" },
  learning: { mine: "/me/learnings", action: "Enroll", done: "Enrolled", view: "Details" },
  event: { mine: "/me/events", action: "Register now", done: "Registered", view: "Event details" },
  demo: { view: "Watch demo" },
  whats_new: { view: "Read more" },
};

export function CatalogGrid({
  kind,
  title,
  description,
  onChange,
}: {
  kind: keyof typeof CATALOG_COPY;
  title: string;
  description?: string;
  onChange?: () => void;
}) {
  const copy = CATALOG_COPY[kind];
  const catalog = useApi<CatalogItem[]>(`/catalog?kind=${kind}`, false);
  const mine = useApi<Mine[]>(copy.mine ?? null);
  const saved = useApi<{ id: string; title: string }[]>("/me/saved");
  const msg = useMessage();
  const [query, setQuery] = useState("");

  const taken = useMemo(() => new Set((mine.data ?? []).map((m) => m.name ?? m.title)), [mine.data]);
  const savedTitles = useMemo(() => new Set((saved.data ?? []).map((s) => s.title)), [saved.data]);
  const items = (catalog.data ?? []).filter((item) =>
    `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  async function take(item: CatalogItem) {
    try {
      await api(copy.mine!, {
        body: { title: item.title, ...(kind === "learning" ? { kind: (item.meta.kind as string) || "course" } : {}) },
        auth: true,
      });
      await mine.reload();
      onChange?.();
      notifyChange();
      msg.ok(`${copy.done}: ${item.title}`);
    } catch (err) {
      msg.fail(err);
    }
  }

  async function toggleSave(item: CatalogItem) {
    try {
      const existing = (saved.data ?? []).find((s) => s.title === item.title);
      if (existing) await api(`/me/saved/${existing.id}`, { method: "DELETE", auth: true });
      else await api("/me/saved", { body: { title: item.title, url: item.url }, auth: true });
      await saved.reload();
      onChange?.();
      notifyChange();
    } catch (err) {
      msg.fail(err);
    }
  }

  return (
    <Section title={title} description={description ?? `${catalog.data?.length ?? 0} results`}>
      <div className="live-toolbar">
        <input
          className="account-form-input live-search"
          type="search"
          placeholder="Search"
          aria-label={`Search ${title}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {catalog.loading && <Empty>Loading…</Empty>}
      {catalog.error && <Empty>{catalog.error}</Empty>}
      {!catalog.loading && !items.length && <Empty>We&apos;re sorry, but your search didn&apos;t return any results.</Empty>}
      <div className="account-grid">
        {items.map((item) => {
          const done = taken.has(item.title);
          const isSaved = savedTitles.has(item.title);
          return (
            <article className="account-card live-card" key={item.id}>
              <div className="account-card-top">
                <span className="live-eyebrow">{item.category}</span>
                {item.badge && <span className="account-badge live-badge">{item.badge}</span>}
              </div>
              <h3>
                <ItemLink url={item.url}>{item.title}</ItemLink>
              </h3>
              <p>{item.description}</p>
              {typeof item.meta.location === "string" && <p className="live-meta">{item.meta.location}</p>}
              {typeof item.meta.duration === "string" && <p className="live-meta">{item.meta.duration}</p>}
              <div className="live-actions">
                {copy.mine ? (
                  done ? (
                    <span className="live-done">✓ {copy.done}</span>
                  ) : (
                    <button type="button" className="btn btn-primary live-btn" onClick={() => take(item)}>
                      {copy.action}
                    </button>
                  )
                ) : (
                  <ItemLink url={item.url} className="account-card-action">
                    {copy.view} <span aria-hidden="true">→</span>
                  </ItemLink>
                )}
                <button
                  type="button"
                  className={`live-save${isSaved ? " is-saved" : ""}`}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `Remove ${item.title} from saved items` : `Save ${item.title}`}
                  onClick={() => toggleSave(item)}
                >
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d="M4 1.75h8a.75.75 0 0 1 .75.75v11.6l-4.75-3-4.75 3V2.5A.75.75 0 0 1 4 1.75Z" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <Toast message={msg.message} error={msg.error} />
    </Section>
  );
}

/** The user's own trials / learnings / events with their status. */
export function MyItems({ kind, title, onChange }: { kind: "trial" | "learning" | "event"; title: string; onChange?: () => void }) {
  const path = CATALOG_COPY[kind].mine!;
  const mine = useApi<Mine[]>(path);
  const msg = useMessage();
  const rows = mine.data ?? [];

  async function remove(item: Mine) {
    try {
      await api(`${path}/${item.id}`, { method: "DELETE", auth: true });
      await mine.reload();
      onChange?.();
      notifyChange();
    } catch (err) {
      msg.fail(err);
    }
  }

  async function complete(item: Mine) {
    try {
      await api(`${path}/${item.id}`, { method: "PATCH", auth: true });
      await mine.reload();
      onChange?.();
      notifyChange();
    } catch (err) {
      msg.fail(err);
    }
  }

  const removeLabel = kind === "trial" ? "End trial" : kind === "event" ? "Cancel registration" : "Remove";
  return (
    <Section title={title} description={`${rows.length} ${rows.length === 1 ? "item" : "items"}`}>
      {!rows.length ? (
        <Empty>{mine.loading ? "Loading…" : "Nothing here yet. Choose from the list below."}</Empty>
      ) : (
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th>Name</th>
                {kind === "learning" && <th>Type</th>}
                <th>Status</th>
                <th>Since</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.name ?? item.title}</td>
                  {kind === "learning" && <td className="live-cap">{item.kind}</td>}
                  <td>
                    <span className={`live-status live-status-${item.status}`}>{item.status}</span>
                  </td>
                  <td>{formatDate(item.created_at)}</td>
                  <td className="live-row-actions">
                    {kind === "learning" && item.status !== "completed" && (
                      <button type="button" className="account-inline-button" onClick={() => complete(item)}>
                        Mark as completed
                      </button>
                    )}
                    <button type="button" className="account-inline-button" onClick={() => remove(item)}>
                      {removeLabel}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Toast message={msg.message} error={msg.error} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Newsletters, marketing choices, e-mail preferences
// ---------------------------------------------------------------------------
type State = { newsletters?: string[]; marketing?: Record<string, string>; recent?: { title: string; url: string; at: string }[] };

export function Newsletters() {
  const catalog = useApi<CatalogItem[]>("/catalog?kind=newsletter", false);
  const state = useApi<State>("/me/state");
  const msg = useMessage();
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected(state.data?.newsletters ?? []), [state.data]);

  async function save() {
    try {
      await api("/me/state", { method: "PATCH", auth: true, body: { data: { newsletters: selected } } });
      msg.ok("Your newsletter subscriptions have been saved.");
    } catch (err) {
      msg.fail(err);
    }
  }

  return (
    <Section title="Newsletter categories" description={`${selected.length} selected`}>
      <div className="account-panel account-preferences">
        {(catalog.data ?? []).map((item) => (
          <label className="account-pref" key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.title)}
              onChange={(event) =>
                setSelected((current) => (event.target.checked ? [...current, item.title] : current.filter((t) => t !== item.title)))
              }
            />
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.description}
                {item.badge ? ` · ${item.badge}` : ""}
              </small>
            </span>
          </label>
        ))}
        <div className="account-form-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
        <Toast message={msg.message} error={msg.error} />
      </div>
    </Section>
  );
}

export function MarketingChoices({
  title,
  description,
  labels,
  options,
}: {
  title: string;
  description?: string;
  labels: string[];
  options: string[];
}) {
  const state = useApi<State>("/me/state");
  const msg = useMessage();
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => setValues(state.data?.marketing ?? {}), [state.data]);

  async function save() {
    try {
      await api("/me/state", { method: "PATCH", auth: true, body: { data: { marketing: values } } });
      msg.ok("Your preferences have been saved.");
    } catch (err) {
      msg.fail(err);
    }
  }

  return (
    <Section title={title} description={description}>
      <div className="account-panel account-choices">
        {labels.map((label) => (
          <fieldset className="account-choice" key={label}>
            <legend>{label}</legend>
            <div className="account-choice-options">
              {options.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`choice-${label}`}
                    value={option}
                    checked={(values[label] ?? "No preference") === option}
                    onChange={() => setValues((current) => ({ ...current, [label]: option }))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="account-form-actions">
          <button type="button" className="btn btn-primary" onClick={save}>
            Submit
          </button>
        </div>
        <Toast message={msg.message} error={msg.error} />
      </div>
    </Section>
  );
}

export function EmailPreferences({ groups }: { groups: { title: string; description?: string; items: { label: string; description: string }[] }[] }) {
  const prefs = useApi<{ preferences: Record<string, boolean> }>("/profile/preferences");
  const msg = useMessage();
  const [values, setValues] = useState<Record<string, boolean>>({});
  useEffect(() => setValues(prefs.data?.preferences ?? {}), [prefs.data]);

  async function save(all?: boolean) {
    const next = { ...values };
    if (all !== undefined) for (const group of groups) for (const item of group.items) next[item.label] = all;
    try {
      const result = await api<{ preferences: Record<string, boolean> }>("/profile/preferences", {
        method: "PUT",
        auth: true,
        body: { preferences: Object.entries(next).map(([topic, enabled]) => ({ topic, enabled })) },
      });
      setValues(result.preferences);
      msg.ok(all === false ? "You have been unsubscribed from all e-mails." : "Your e-mail preferences have been saved.");
    } catch (err) {
      msg.fail(err);
    }
  }

  return (
    <>
      {groups.map((group) => (
        <Section title={group.title} description={group.description} key={group.title}>
          <div className="account-panel account-preferences">
            {group.items.map((item) => (
              <label className="account-pref" key={item.label}>
                <input
                  type="checkbox"
                  checked={values[item.label] ?? false}
                  onChange={(event) => setValues((current) => ({ ...current, [item.label]: event.target.checked }))}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </label>
            ))}
          </div>
        </Section>
      ))}
      <section className="account-section">
        <div className="account-form-actions">
          <button type="button" className="btn btn-primary" onClick={() => save()}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => save(false)}>
            Unsubscribe from all
          </button>
        </div>
        <Toast message={msg.message} error={msg.error} />
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Library: recently viewed and saved items
// ---------------------------------------------------------------------------
export function RecentlyViewed() {
  const state = useApi<State>("/me/state");
  const rows = state.data?.recent ?? [];
  return (
    <Section title="Recently viewed content" description={`${rows.length} results`}>
      {!rows.length ? (
        <Empty>{state.loading ? "Loading…" : "Pages you open while signed in will appear here."}</Empty>
      ) : (
        <ul className="account-panel live-list">
          {rows.map((row) => (
            <li key={row.url}>
              <Link href={row.url}>{row.title}</Link>
              <small>{formatDate(row.at)}</small>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function SavedItems() {
  const saved = useApi<{ id: string; title: string; url: string; created_at: string }[]>("/me/saved");
  const msg = useMessage();
  const rows = saved.data ?? [];
  return (
    <Section title="Saved content" description={`${rows.length} results`}>
      {!rows.length ? (
        <Empty>
          {saved.loading ? "Loading…" : "We're sorry, but your search didn't return any results."}{" "}
          {!saved.loading && <Link href="/dashboard/what-is-new">Browse new content</Link>}
        </Empty>
      ) : (
        <ul className="account-panel live-list">
          {rows.map((row) => (
            <li key={row.id}>
              <ItemLink url={row.url}>{row.title}</ItemLink>
              <small>Saved {formatDate(row.created_at)}</small>
              <button
                type="button"
                className="account-inline-button"
                onClick={async () => {
                  try {
                    await api(`/me/saved/${row.id}`, { method: "DELETE", auth: true });
                    await saved.reload();
                  } catch (err) {
                    msg.fail(err);
                  }
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <Toast message={msg.message} error={msg.error} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------
type Message = { id: string; subject: string; sender: string; body: string; is_read: boolean; created_at: string; source: "user" | "broadcast" };

export function Inbox() {
  const inbox = useApi<Message[]>("/me/inbox");
  const msg = useMessage();
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = inbox.data ?? [];
  const unread = rows.filter((m) => !m.is_read).length;

  async function open(message: Message) {
    setOpenId(openId === message.id ? null : message.id);
    if (message.is_read) return;
    try {
      await api(`/me/inbox/${message.id}/read?source=${message.source}`, { method: "POST", auth: true });
      inbox.setData(rows.map((m) => (m.id === message.id ? { ...m, is_read: true } : m)));
    } catch (err) {
      msg.fail(err);
    }
  }

  return (
    <Section title={`${rows.length} messages`} description={unread ? `${unread} unread` : undefined}>
      {!rows.length ? (
        <Empty>{inbox.loading ? "Loading…" : "Your inbox is empty."}</Empty>
      ) : (
        <div className="account-panel account-messages">
          {rows.map((message) => (
            <div className={`live-message${openId === message.id ? " is-open" : ""}`} key={message.id}>
              <button type="button" className="account-message live-message-head" onClick={() => open(message)} aria-expanded={openId === message.id}>
                {!message.is_read && <span className="account-unread" aria-label="Unread" />}
                <div>
                  <strong>{message.subject}</strong>
                  <small>{message.sender}</small>
                </div>
                <span className="account-message-date">{formatDate(message.created_at)}</span>
              </button>
              {openId === message.id && (
                <div className="live-message-body">
                  {message.body.split("\n").map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                  {message.source === "user" && (
                    <button
                      type="button"
                      className="account-inline-button"
                      onClick={async () => {
                        try {
                          await api(`/me/inbox/${message.id}`, { method: "DELETE", auth: true });
                          await inbox.reload();
                        } catch (err) {
                          msg.fail(err);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Toast message={msg.message} error={msg.error} />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Orders, shopping cart (demo checkout)
// ---------------------------------------------------------------------------
type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items: { product: string; plan: string; quantity: number; unit_price: number }[];
};

export function Orders() {
  const orders = useApi<Order[]>("/me/orders");
  const rows = orders.data ?? [];
  return (
    <Section title="Recent orders" description={`${rows.length} ${rows.length === 1 ? "order" : "orders"}`}>
      {!rows.length ? (
        <Empty>
          {orders.loading ? "Loading…" : "You haven't placed any orders yet."}{" "}
          {!orders.loading && <Link href="/shopping-cart">Go to your shopping cart</Link>}
        </Empty>
      ) : (
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Product</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.items.length ? order.items.map((i) => `${i.quantity} × ${i.product}`).join(", ") : "--"}</td>
                  <td>
                    <span className="live-status live-status-active">{order.status}</span>
                  </td>
                  <td>{formatMoney(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

type CartItem = { id: string; product: string; plan: string; quantity: number; unit_price: number };

export function ShoppingCart() {
  const cart = useApi<CartItem[]>("/me/cart");
  const products = useApi<CatalogItem[]>("/catalog?kind=product", false);
  const msg = useMessage();
  const [busy, setBusy] = useState(false);
  const rows = cart.data ?? [];
  const total = rows.reduce((sum, row) => sum + Number(row.unit_price) * row.quantity, 0);

  async function act(work: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await work();
      await cart.reload();
      notifyChange();
      if (success) msg.ok(success);
    } catch (err) {
      msg.fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Section title="Your items" description={`${rows.length} ${rows.length === 1 ? "item" : "items"}`}>
        {!rows.length ? (
          <Empty>{cart.loading ? "Loading…" : "Your shopping cart is empty."}</Empty>
        ) : (
          <div className="account-table-wrap">
            <table className="account-table live-cart">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.product}</td>
                    <td>{row.plan || "Subscription"}</td>
                    <td>
                      <input
                        className="account-form-input live-qty"
                        type="number"
                        min={1}
                        max={999}
                        aria-label={`Quantity of ${row.product}`}
                        defaultValue={row.quantity}
                        onBlur={(event) => {
                          const quantity = Math.max(1, Math.min(999, Number(event.target.value) || 1));
                          if (quantity !== row.quantity)
                            act(() => api(`/me/cart/${row.id}`, { method: "PATCH", auth: true, body: { quantity } }));
                        }}
                      />
                    </td>
                    <td>{formatMoney(Number(row.unit_price) * row.quantity)}</td>
                    <td>
                      <button type="button" className="account-inline-button" onClick={() => act(() => api(`/me/cart/${row.id}`, { method: "DELETE", auth: true }))}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>
                    <strong>Total</strong>
                  </td>
                  <td colSpan={2}>
                    <strong>{formatMoney(total)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {!!rows.length && (
          <div className="account-form-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const order = await api<{ order_number: string }>("/me/checkout", { method: "POST", auth: true });
                  msg.ok(`Thank you! Order ${order.order_number} has been placed. You'll find it under Orders.`);
                })
              }
            >
              Check out
            </button>
            <span className="live-note">Demo checkout: no payment is taken.</span>
          </div>
        )}
        <Toast message={msg.message} error={msg.error} />
      </Section>

      <Section title="SAP Store" description="Add products to your cart.">
        <div className="account-grid">
          {(products.data ?? []).map((product) => (
            <article className="account-card live-card" key={product.id}>
              <div className="account-card-top">
                <span className="live-eyebrow">{product.category}</span>
                {product.badge && <span className="account-badge live-badge">{product.badge}</span>}
              </div>
              <h3>
                <ItemLink url={product.url}>{product.title}</ItemLink>
              </h3>
              <p>{product.description}</p>
              <p className="live-price">
                {formatMoney(product.price)}
                {typeof product.meta.plan === "string" && <small> · {product.meta.plan}</small>}
              </p>
              <div className="live-actions">
                <button
                  type="button"
                  className="btn btn-primary live-btn"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () =>
                        api("/me/cart", {
                          auth: true,
                          body: {
                            product: product.title,
                            plan: (product.meta.plan as string) || product.badge,
                            unit_price: Number(product.price),
                            quantity: 1,
                          },
                        }),
                      `${product.title} was added to your cart.`
                    )
                  }
                >
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Product login (SAP Ariba, Concur, Fieldglass, SuccessFactors)
// ---------------------------------------------------------------------------
export function ProductLogin({ product, fallback }: { product: string; fallback: { label: string; placeholder: string; help: string } }) {
  const logins = useApi<CatalogItem[]>("/catalog?kind=product_login", false);
  const item = (logins.data ?? []).find((row) => row.category === product);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const label = (item?.meta.field_label as string) || fallback.label;
  const placeholder = (item?.meta.placeholder as string) || fallback.placeholder;
  const help = (item?.meta.help as string) || fallback.help;

  return (
    <section className="account-section">
      <div className="account-panel account-product-card">
        <h2>Log on</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) {
              setError(`Please enter your ${label}.`);
              return;
            }
            if (!item?.url) {
              setError("The login address for this product hasn't been set up yet.");
              return;
            }
            setError("");
            window.open(item.url.replace("{companyId}", encodeURIComponent(value.trim())), "_blank", "noopener,noreferrer");
          }}
        >
          <label className="account-product-label" htmlFor="product-company">
            {label}
          </label>
          <input id="product-company" className="account-product-input" placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} />
          <button type="submit" className="btn btn-primary">
            Log on
          </button>
        </form>
        <p className="account-product-help">{help}</p>
        {error && <p className="account-form-status account-form-error" role="alert">{error}</p>}
        <p className="live-note">You&apos;ll continue to {item?.title ?? "the product"}&apos;s own sign-in page in a new tab.</p>
      </div>
    </section>
  );
}
