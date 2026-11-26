"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type MenuLink = { label: string; href: string; external?: boolean };

// Same entries, order and external-link markers as sap.com's profile menu.
const ACCOUNT_LINKS: MenuLink[] = [
  { label: "Manage my account", href: "/account/manage", external: true },
  { label: "Dashboard", href: "/dashboard" },
  { label: "E-mail preferences", href: "/dashboard/marketing-preferences" },
  { label: "Free trials", href: "/dashboard/trials" },
  { label: "Learning", href: "/dashboard/learnings" },
  { label: "Orders", href: "/orders", external: true },
  { label: "Shopping cart", href: "/shopping-cart" },
  { label: "Inbox", href: "/inbox", external: true },
];

const PRODUCT_LINKS: MenuLink[] = [
  { label: "SAP Ariba", href: "/product-login/ariba" },
  { label: "SAP Concur", href: "/product-login/concur", external: true },
  { label: "SAP Fieldglass", href: "/product-login/fieldglass", external: true },
  { label: "SAP SuccessFactors", href: "/product-login/successfactors", external: true },
];

const ExternalIcon = () => (
  <svg className="pm-ext" viewBox="0 0 16 16" width="14" height="14" aria-label="(opens in new tab)">
    <path
      d="M9.5 2.5h4v4M13.5 2.5 7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function MenuColumn({ title, links, onClose }: { title: string; links: MenuLink[]; onClose: () => void }) {
  return (
    <div className="pm-col">
      <p className="pm-heading">{title}</p>
      <ul>
        {links.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="pm-link"
              role="menuitem"
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              onClick={onClose}
            >
              {item.label}
              {item.external && <ExternalIcon />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { account, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await signOut();
    onClose();
    router.push("/");
  }

  return (
    <div className="pm" role="menu" aria-label="Account and activity">
      <div className="pm-user">
        <span className="pm-avatar" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="34" height="34">
            <circle cx="16" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M6.5 27c0-5.5 4.3-9 9.5-9s9.5 3.5 9.5 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </span>
        <strong className="pm-name">{account?.displayName}</strong>
        <span className="pm-email">{account?.email}</span>
      </div>

      <div className="pm-cols">
        <MenuColumn title="Account and activity" links={ACCOUNT_LINKS} onClose={onClose} />
        <MenuColumn title="Product login" links={PRODUCT_LINKS} onClose={onClose} />
      </div>

      <button type="button" className="pm-logout" role="menuitem" onClick={logout} disabled={busy}>
        Logout
      </button>
    </div>
  );
}
