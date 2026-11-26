"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AccountForm from "@/components/AccountForm";
import {
  CatalogGrid,
  EmailPreferences,
  Inbox,
  MarketingChoices,
  MyItems,
  Newsletters,
  Orders,
  ProductLogin,
  RecentlyViewed,
  SavedItems,
  ShoppingCart,
} from "@/components/AccountLive";
import { useAuth } from "@/components/AuthProvider";
import {
  getAccountPage,
  type AccountCard,
  type AccountPageConfig,
  type AccountPageKey,
  type AccountSection,
} from "@/data/account-pages";
import type { SapAccount } from "@/lib/auth";
import { useApi, type Summary } from "@/lib/use-api";

function fill(template: string, account: SapAccount) {
  return template
    .replaceAll("{name}", account.displayName)
    .replaceAll("{firstName}", account.firstName)
    .replaceAll("{lastName}", account.lastName)
    .replaceAll("{email}", account.email)
    .replaceAll("{company}", account.company || "--")
    .replaceAll("{country}", account.country || "--")
    .replaceAll("{department}", account.department || "--")
    .replaceAll("{relationship}", account.relationship || "--")
    .replaceAll("{phone}", account.phone || "--");
}

function AccountGate({ path }: { path: string }) {
  return (
    <section className="account-gate">
      <div className="account-gate-card">
        <div className="account-gate-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path d="M12 1.75a4.25 4.25 0 0 1 4.25 4.25V9h.75c1.24 0 2.25 1.01 2.25 2.25v8.5c0 1.24-1.01 2.25-2.25 2.25h-10A2.25 2.25 0 0 1 5 19.75v-8.5C5 10.01 6.01 9 7.25 9H8V6A4.25 4.25 0 0 1 12 1.75Zm0 1.5A2.75 2.75 0 0 0 9.25 6v3h5.5V6A2.75 2.75 0 0 0 12 3.25Z" />
          </svg>
        </div>
        <p className="account-gate-kicker">SAP MENA</p>
        <h1>The requested content is gated</h1>
        <p>Authentication is required in order to proceed.</p>
        <Link className="btn btn-primary account-gate-button" href={`/login?next=${encodeURIComponent(path)}`}>
          Access Premium Content
        </Link>
      </div>
    </section>
  );
}

// Live numbers on the dashboard cards (card title -> badge/description).
function liveCards(summary: Summary | null): Record<string, Partial<AccountCard>> {
  if (!summary) return {};
  const learnings = summary.learnings.courses + summary.learnings.tutorials;
  return {
    Product: { description: summary.interests.length ? summary.interests.join(", ") : "No interests selected yet" },
    "What's new?": { badge: String(summary.whats_new), description: `${summary.whats_new} new items` },
    Demos: { badge: String(summary.demos), description: "Recommended demos" },
    "Free trials": {
      badge: String(summary.trials.active),
      description: `${summary.trials.active} active · ${summary.trials.recommended} recommended`,
    },
    "Active learnings": {
      badge: String(learnings),
      description: `${summary.learnings.courses} courses · ${summary.learnings.tutorials} developer tutorials`,
    },
    Events: { badge: String(summary.events.registered), description: `${summary.events.registered} registered · ${summary.events.recommended} recommended` },
    Newsletters: { badge: String(summary.newsletters), description: `${summary.newsletters} selected` },
    "Recently viewed": { badge: summary.recent ? String(summary.recent) : undefined },
    "Saved items": { badge: String(summary.saved), description: `${summary.saved} saved` },
    "Marketing preferences": { badge: String(summary.marketing) },
    "Active trials": { badge: String(summary.trials.active), description: `${summary.trials.active} active` },
    "Recommended trials": { badge: String(summary.trials.recommended), description: `${summary.trials.recommended} recommended` },
    Course: { badge: String(summary.learnings.courses), description: `${summary.learnings.courses} courses in your learning plan.` },
    "Developer Tutorial": { badge: String(summary.learnings.tutorials), description: `${summary.learnings.tutorials} developer tutorials.` },
  };
}

const SUMMARY_PAGES = new Set(["dashboard", "dashboard-trials", "dashboard-learnings", "what-is-new"]);
const PRODUCT_LOGINS = new Set(["ariba", "concur", "fieldglass", "successfactors"]);

/** Which static sections to keep, and the live block for each page. */
function livePlan(
  pageKey: string,
  page: AccountPageConfig,
  refresh: () => void
): { keep: (section: AccountSection, index: number) => boolean; before?: ReactNode; after?: ReactNode } {
  const none = () => false;
  switch (pageKey) {
    case "trials":
      return { keep: none, after: <CatalogGrid kind="trial" title="Popular trials" onChange={refresh} /> };
    case "dashboard-trials":
      return {
        keep: () => true,
        after: (
          <>
            <MyItems kind="trial" title="Your trials" onChange={refresh} />
            <CatalogGrid kind="trial" title="Recommended trials" onChange={refresh} />
          </>
        ),
      };
    case "learning":
      return { keep: none, after: <CatalogGrid kind="learning" title="Recommended for you" onChange={refresh} /> };
    case "dashboard-learnings":
      return {
        keep: () => true,
        after: (
          <>
            <MyItems kind="learning" title="Your learning plan" onChange={refresh} />
            <CatalogGrid kind="learning" title="Recommended learning" onChange={refresh} />
          </>
        ),
      };
    case "events":
      return {
        keep: none,
        after: (
          <>
            <CatalogGrid kind="event" title="Recommended events" onChange={refresh} />
            <MyItems kind="event" title="Your registrations" onChange={refresh} />
          </>
        ),
      };
    case "demos":
      return { keep: none, after: <CatalogGrid kind="demo" title="Recommended demos" /> };
    case "what-is-new":
      return { keep: (_, index) => index === 0, after: <CatalogGrid kind="whats_new" title="What's new" /> };
    case "newsletters":
      return { keep: none, after: <Newsletters /> };
    case "recently-viewed":
      return { keep: none, after: <RecentlyViewed /> };
    case "saved-items":
      return { keep: (section) => !section.title.startsWith("Saved"), before: <SavedItems /> };
    case "marketing-preferences": {
      const choices = page.sections.find((section) => section.choices);
      return {
        keep: (section) => !section.choices,
        before: choices ? (
          <MarketingChoices
            title={choices.title}
            description={choices.description}
            labels={choices.choices!.map((c) => c.label)}
            options={choices.choices![0]?.options ?? ["Interested", "Not interested", "No preference"]}
          />
        ) : null,
      };
    }
    case "email-preferences":
      return {
        keep: (section) => !section.preferences,
        after: (
          <EmailPreferences
            groups={page.sections
              .filter((section) => section.preferences)
              .map((section) => ({ title: section.title, description: section.description, items: section.preferences! }))}
          />
        ),
      };
    case "orders":
      return { keep: none, after: <Orders /> };
    case "shopping-cart":
      return { keep: none, after: <ShoppingCart /> };
    case "inbox":
      return { keep: none, after: <Inbox /> };
    default:
      return { keep: () => true };
  }
}

export default function AccountPageContent({ pageKey }: { pageKey: AccountPageKey }) {
  const { account, ready } = useAuth();
  const pathname = usePathname();
  const defaults = getAccountPage(pageKey);
  // Admin edits (Admin panel → Page content) override the default text.
  const override = useApi<Partial<AccountPageConfig>>(`/content/account:${pageKey}`, false);
  const page: AccountPageConfig = { ...defaults, ...(override.data && Object.keys(override.data).length ? override.data : {}) };
  const summary = useApi<Summary>(account && SUMMARY_PAGES.has(pageKey) ? "/me/summary" : null);
  const live = liveCards(summary.data);

  if (!ready) {
    return <div className="account-loading">Loading your SAP account…</div>;
  }

  if (!account) {
    return <AccountGate path={pathname} />;
  }

  const plan = livePlan(pageKey, page, () => summary.reload());
  const sections = page.sections.filter(plan.keep);

  return (
    <div className="account-shell">
      <nav className="account-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">My SAP</Link>
        <span aria-hidden="true">/</span>
        <span>{page.title.replace("{name}", "Dashboard")}</span>
      </nav>

      <header className="account-hero">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{fill(page.title, account)}</h1>
        <p>{page.subtitle}</p>
      </header>

      {plan.before}

      {sections.map((section) => (
        <section className="account-section" key={section.title}>
          <h2>{section.title}</h2>
          {section.description && <p className="account-section-description">{section.description}</p>}

          {section.cards && (
            <div className="account-grid">
              {section.cards.map((base) => {
                const card = { ...base, ...live[base.title] };
                return (
                  <Link className="account-card" href={card.href} key={card.title}>
                    <div className="account-card-top">
                      <h3>{card.title}</h3>
                      {card.badge && <span className="account-badge">{card.badge}</span>}
                    </div>
                    <p>{card.description}</p>
                    <span className="account-card-action">
                      {card.action || "Open"} <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {section.rows && (
            <dl className="account-panel account-rows">
              {section.rows.map((row) => (
                <div className="account-row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{fill(row.value, account)}</dd>
                </div>
              ))}
            </dl>
          )}

          {section.table && (
            <div className="account-table-wrap">
              <table className="account-table">
                <thead>
                  <tr>
                    {section.table.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex}>{fill(cell, account)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section.messages && (
            <div className="account-panel account-messages">
              {section.messages.map((message) => (
                <div className="account-message" key={message.subject}>
                  {message.unread && <span className="account-unread" aria-label="Unread" />}
                  <div>
                    <strong>{message.subject}</strong>
                    <small>{message.from}</small>
                  </div>
                  <span className="account-message-date">{message.date}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {plan.after}

      {page.form && (
        <section className="account-section">
          <div className="account-panel">
            <AccountForm variant={page.form} />
          </div>
        </section>
      )}

      {page.product && PRODUCT_LOGINS.has(pageKey) && <ProductLogin product={pageKey} fallback={page.product} />}
    </div>
  );
}
