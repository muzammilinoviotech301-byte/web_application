"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { type MastheadMenu, type MenuColumn } from "@/data/masthead-menu";

// Columns per row in a masthead menu (Industries wraps onto a second row).
function menuColumnCount(columns: MenuColumn[]) {
  return columns.filter((column) => !column.row).length;
}

// Local routes use client navigation; sap.com and other sites open normally.
function MenuAnchor({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default function MastheadMenuPanel({
  menu,
  onLinkClick,
  tt,
  style,
}: {
  menu: MastheadMenu;
  onLinkClick: () => void;
  tt: (text: string) => string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`masthead-menu masthead-menu-${menu.layout}`}
      style={style}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onLinkClick();
      }}
    >
      <div
        className="masthead-menu-grid"
        style={{ ["--menu-cols" as string]: String(menuColumnCount(menu.columns)) }}
      >
        {menu.title && <p className="masthead-menu-heading">{tt(menu.title)}</p>}
        {menu.columns.map((column, index) => (
          <div
            key={column.title ?? index}
            className="masthead-menu-column"
            style={column.row ? { gridRow: column.row + 1 } : undefined}
          >
            {column.title &&
              (column.titleHref ? (
                <MenuAnchor className="masthead-menu-title" href={column.titleHref}>
                  <span>{tt(column.title)}</span>
                  <span className="masthead-menu-chevron" aria-hidden="true" />
                </MenuAnchor>
              ) : (
                <span className="masthead-menu-title masthead-menu-title-plain">
                  {tt(column.title)}
                </span>
              ))}
            <ul className="masthead-menu-list">
              {column.groups.map((group, groupIndex) => (
                <li key={group.label ?? groupIndex}>
                  {group.label && (
                    <span className="masthead-menu-group">{tt(group.label)}</span>
                  )}
                  <ul className={group.label ? "masthead-menu-grouped" : undefined}>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <MenuAnchor className="masthead-menu-link" href={link.href}>
                          {tt(link.label)}
                          {link.external && (
                            <span className="masthead-menu-external" aria-hidden="true" />
                          )}
                        </MenuAnchor>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
