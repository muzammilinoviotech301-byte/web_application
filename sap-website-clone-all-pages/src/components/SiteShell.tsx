/* eslint-disable @next/next/no-img-element -- static local SAP brand assets */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MOBILE_NAV, SEARCH_INDEX } from "@/data/navigation";
import {
  EXPLORE_SAP_MENU,
  MASTHEAD_MENUS,
  type MastheadMenu,
  type MenuColumn,
} from "@/data/masthead-menu";
import { SITE_FOOTER_HTML } from "@/data/site-footer";
import CapturedRuntimeEnhancer from "@/components/CapturedRuntimeEnhancer";
import LoginDialog from "@/components/LoginDialog";
import { useLocale } from "@/components/LocaleProvider";
import ProfileMenu from "@/components/ProfileMenu";
import RecentTracker from "@/components/RecentTracker";
import RegionSwitcher from "@/components/RegionSwitcher";
import SecondaryNavSticky from "@/components/SecondaryNavSticky";
import ShadowRootHydrator from "@/components/ShadowRootHydrator";
import { useAuth } from "@/components/AuthProvider";

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

function MastheadMenuPanel({
  menu,
  onLinkClick,
  tt,
}: {
  menu: MastheadMenu;
  onLinkClick: () => void;
  tt: (text: string) => string;
}) {
  return (
    <div
      className={`masthead-menu masthead-menu-${menu.layout}`}
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

// Masthead icons use SAP's own UI5 16x16 icon paths (filled), as on sap.com.
const ICONS = {
  search:
    '<svg viewBox="0 0 16 16"><path d="M7 1a6 6 0 0 1 4.738 9.678l3.042 3.042a.75.75 0 1 1-1.06 1.06l-3.042-3.042A6 6 0 1 1 7 1Zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/></svg>',
  world:
    '<svg viewBox="0 0 16 16"><path d="M4.14 6.535H1.666a6.785 6.785 0 0 0 0 2.93h2.476a10.104 10.104 0 0 1 0-2.93Zm1.91 4.43c.574 1.675 1.496 3 1.907 3.533h.085c.41-.533 1.334-1.858 1.907-3.533H6.051Zm-3.844 0a6.456 6.456 0 0 0 3.707 3.196 13.702 13.702 0 0 1-1.436-3.196H2.206Zm9.317 0a13.695 13.695 0 0 1-1.437 3.196 6.455 6.455 0 0 0 3.708-3.196h-2.27Zm-1.437-9.127a13.697 13.697 0 0 1 1.437 3.197h2.27a6.456 6.456 0 0 0-3.707-3.197ZM7.957 1.5c-.41.533-1.332 1.858-1.906 3.534h3.898C9.375 3.36 8.453 2.033 8.042 1.501h-.085Zm-2.044.337a6.456 6.456 0 0 0-3.707 3.197h2.27a13.704 13.704 0 0 1 1.437-3.197ZM5.66 9.465h4.68a8.639 8.639 0 0 0 0-2.93H5.66a8.64 8.64 0 0 0 0 2.93Zm6.2 0h2.475a6.787 6.787 0 0 0 0-2.93h-2.476a10.06 10.06 0 0 1 0 2.93ZM16 8a7.964 7.964 0 0 1-7.41 7.976 7.64 7.64 0 0 1-1.182 0A7.964 7.964 0 0 1 0 8 7.964 7.964 0 0 1 7.408.024a7.903 7.903 0 0 1 1.183 0A7.964 7.964 0 0 1 16 8Z"/></svg>',
  employee:
    '<svg viewBox="0 0 16 16"><path d="M8 1a4 4 0 0 1 2.616 7.023C12.61 8.931 14 10.927 14 13.25v1a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75v-1c0-2.323 1.39-4.319 3.383-5.227A4 4 0 0 1 8 1ZM6.034 9.375C4.54 10.042 3.5 11.53 3.5 13.25v.25h3.75v-2.797l-.848-.444a.75.75 0 0 1-.368-.884Zm3.93 0c.031.099.044.203.031.309a.75.75 0 0 1-.397.575l-.848.444V13.5h3.75v-.25c0-1.72-1.04-3.208-2.535-3.875ZM10.25 11a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5h.5ZM8 2.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>',
  menu: '<svg viewBox="0 0 16 16"><path d="M1.75 3h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Zm0 4.25h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Zm0 4.25h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Z"/></svg>',
  close:
    '<svg viewBox="0 0 16 16"><path d="M12.2 13a.8.8 0 0 1-.57-.23L8 9.14l-3.63 3.63a.8.8 0 1 1-1.13-1.13L6.87 8 3.24 4.37A.8.8 0 1 1 4.37 3.24L8 6.87l3.63-3.63A.8.8 0 1 1 12.76 4.37L9.13 8l3.63 3.63c.31.31.31.82 0 1.13A.8.8 0 0 1 12.2 13Z"/></svg>',
} as const;

type IconName = keyof typeof ICONS;

function Icon({ name }: { name: IconName }) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex" }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}

export default function SiteShell({ children }: { children: ReactNode }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { account } = useAuth();
  const { region, t, tt } = useLocale();
  const pathname = usePathname();
  // community.sap.com owns its own masthead and footer; the local SAP shell
  // would duplicate them and change the captured layout. This applies to the
  // community home and to every captured /t5/ community page.
  const normalizedPath = pathname.replace(/\/$/, "");
  const isCommunityPage =
    normalizedPath === "/community" ||
    normalizedPath.startsWith("/community/") ||
    normalizedPath.startsWith("/t5/");
  // This route is rendered from the exact Canadian sap.com capture, including
  // its own header, footer, and main landmark. The clone shell would duplicate
  // them (and inject the MENA country banner), so it is omitted here.
  const isExactCanadianSpendPage =
    normalizedPath === "/products/spend-management" ||
    normalizedPath === "/canada/products/spend-management";
  const [query, setQuery] = useState("");
  const [countryBannerVisible, setCountryBannerVisible] = useState(true);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 8);
    return SEARCH_INDEX.filter(([label, , description]) =>
      `${label} ${description}`.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setExploreOpen(false);
        setMobileOpen(false);
        setSearchOpen(false);
        setAuthOpen(false);
        setProfileOpen(false);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".nav-item")) setOpenMenu(null);
      if (!target.closest(".explore-wrap")) setExploreOpen(false);
      if (!target.closest(".profile-wrap")) setProfileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onDocClick);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  useEffect(() => {
    // The captured SAP Community page has no live JavaScript. These helpers
    // reproduce the header behaviour from community.sap.com without jQuery.
    const closeCommunityMenus = () => {
      const header = document.querySelector<HTMLElement>(".custom-local-header");
      header?.querySelectorAll<HTMLElement>(".is-open").forEach((el) => {
        el.classList.remove("is-open");
      });
      document.querySelector<HTMLElement>(".user-menu")?.classList.remove("mobile-menu-open");
      document.body.classList.remove("custom-mobile-open");
      header?.classList.remove("show-search");
    };

    const renderCommunityMobileMenu = (root: Element | null) => {
      const list = document.querySelector<HTMLUListElement>(".sub-menu-mobile .visible-menu ul");
      if (!list || !root) return;

      const links: HTMLAnchorElement[] = [];
      Array.from(root.children)
        .filter((child): child is HTMLUListElement => child.tagName === "UL")
        .forEach((ul) => {
          Array.from(ul.children)
            .filter((child): child is HTMLLIElement => child.tagName === "LI")
            .forEach((li) => {
              const link = li.querySelector<HTMLAnchorElement>(":scope > a");
              if (link) links.push(link);
            });
        });

      list.replaceChildren(
        ...links.map((link) => {
          const item = document.createElement("li");
          item.appendChild(link.cloneNode(true));
          if (link.closest("li")?.classList.contains("custom-explore-menu")) {
            item.classList.add("hidden");
          }
          return item;
        })
      );
    };

    const executeCommunitySearch = (input: HTMLInputElement | null) => {
      const query = encodeURIComponent(input?.value ?? "");
      window.location.href =
        `https://community.sap.com/t5/forums/searchpage/tab/message?ct=all&q=${query}`;
    };

    const handleCommunityHeader = (event: MouseEvent, target: HTMLElement) => {
      const header = document.querySelector<HTMLElement>(".custom-local-header");
      if (!header) return;

      const searchToggle = target.closest<HTMLAnchorElement>(".user-menu-search > a");
      if (searchToggle) {
        event.preventDefault();
        header.classList.add("show-search");
        window.requestAnimationFrame(() => {
          header
            .querySelector<HTMLInputElement>(".desktop-sap-search input.execute-search")
            ?.focus();
        });
        return;
      }

      const closeButton = target.closest<HTMLAnchorElement>(".user-menu-close a");
      if (closeButton) {
        event.preventDefault();
        closeCommunityMenus();
        return;
      }

      const mobileToggle = target.closest<HTMLAnchorElement>(".mobile-menu-toggle");
      if (mobileToggle) {
        event.preventDefault();
        renderCommunityMobileMenu(header.querySelector<HTMLElement>(".shadow-menu"));
        header.querySelectorAll<HTMLElement>(".mobile-selected").forEach((el) => {
          el.classList.remove("mobile-selected");
        });
        header.querySelector<HTMLElement>(".user-menu-mobile")?.classList.add("mobile-selected");
        header.querySelector<HTMLElement>(".sub-menu-mobile")?.classList.add("is-open");
        header
          .querySelector<HTMLElement>(".sub-menu-mobile .user-menu-avatar .sub-menu")
          ?.classList.remove("is-open");
        const visibleMenu = header.querySelector<HTMLElement>(".visible-menu");
        if (visibleMenu) visibleMenu.style.display = "block";
        header.querySelector<HTMLElement>(".user-menu")?.classList.add("mobile-menu-open");
        document.body.classList.add("custom-mobile-open");
        return;
      }

      const visibleLink = target.closest<HTMLAnchorElement>(".visible-menu a");
      if (visibleLink && !visibleLink.classList.contains("mobile-explore-button")) {
        const exploreSap = header.querySelector<HTMLElement>(".explore-sap");
        const mobileSearch = header.querySelector<HTMLElement>(".mobile-sap-search");
        if (visibleLink.classList.contains("trigger-explore-menu")) {
          if (exploreSap) exploreSap.style.display = "none";
          if (mobileSearch) mobileSearch.style.display = "none";
        } else {
          if (exploreSap) exploreSap.style.display = "flex";
          if (mobileSearch) mobileSearch.style.display = "flex";
        }

        if (visibleLink.getAttribute("href") !== "#") {
          closeCommunityMenus();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        const id = Number(visibleLink.dataset.id);
        const root =
          id === 0
            ? header.querySelector<HTMLElement>(".shadow-menu")
            : header
                .querySelector<HTMLElement>(`.shadow-menu a[data-id="${id}"]`)
                ?.closest<HTMLElement>("li");
        renderCommunityMobileMenu(root ?? null);
        return;
      }

      const exploreButton = target.closest<HTMLAnchorElement>(".explore-sap > a");
      if (exploreButton) {
        event.preventDefault();
        header.querySelector<HTMLAnchorElement>(".visible-menu li.hidden > a")?.click();
        return;
      }

      const avatarLink = target.closest<HTMLAnchorElement>(".user-menu-avatar a.avatar");
      if (avatarLink) {
        event.preventDefault();
        const item = avatarLink.closest<HTMLElement>(".user-menu-avatar");
        if (window.innerWidth < 1280) {
          const visibleMenu = header.querySelector<HTMLElement>(".visible-menu");
          if (visibleMenu) visibleMenu.style.display = "none";
          header
            .querySelector<HTMLElement>(".sub-menu-mobile .user-menu-avatar .sub-menu")
            ?.classList.add("is-open");
          header.querySelectorAll<HTMLElement>(".mobile-selected").forEach((el) => {
            el.classList.remove("mobile-selected");
          });
          header.querySelectorAll<HTMLElement>(".user-menu-avatar").forEach((el) => {
            el.classList.add("mobile-selected");
          });
          return;
        }

        const wasOpen = item?.classList.contains("is-open") ?? false;
        header
          .querySelectorAll<HTMLElement>(
            ".logo-navigation li.has-submenu, .user-menu-avatar, .explore-menu.has-submenu"
          )
          .forEach((el) => el.classList.remove("is-open"));
        if (!wasOpen) item?.classList.add("is-open");
        return;
      }

      const menuLink = target.closest<HTMLAnchorElement>(
        ".logo-navigation li.has-submenu > a," +
          " .user-menu .explore-menu.has-submenu > a"
      );
      if (menuLink) {
        if (menuLink.getAttribute("href") !== "#") {
          closeCommunityMenus();
          return;
        }

        event.preventDefault();
        // The live site does not open desktop mega menus in the mobile layout.
        if (window.innerWidth < 1280) return;

        const item = menuLink.closest<HTMLElement>("li");
        const wasOpen = item?.classList.contains("is-open") ?? false;
        header
          .querySelectorAll<HTMLElement>(
            ".logo-navigation li.has-submenu, .user-menu-avatar, .explore-menu.has-submenu"
          )
          .forEach((el) => el.classList.remove("is-open"));
        if (!wasOpen) item?.classList.add("is-open");
        return;
      }

      const searchButton = target.closest<HTMLButtonElement>("button.execute-search");
      if (searchButton) {
        const input = searchButton
          .closest<HTMLElement>("div")
          ?.querySelector<HTMLInputElement>("input.execute-search");
        executeCommunitySearch(input ?? null);
        return;
      }

      if (window.innerWidth >= 1280) {
        const isClickInDesktopNav =
          !!target.closest(".logo-navigation") ||
          !!target.closest(".user-menu-avatar") ||
          !!target.closest(".explore-menu");
        if (
          !isClickInDesktopNav ||
          (!target.closest("a") && !target.closest(".sub-menu"))
        ) {
          header
            .querySelectorAll<HTMLElement>(".logo-navigation .is-open, .user-menu .is-open")
            .forEach((el) => el.classList.remove("is-open"));
        }
      }
    };

    const onCommunityKeydown = (event: KeyboardEvent) => {
      const input = event.target;
      if (
        event.key === "Enter" &&
        input instanceof HTMLInputElement &&
        input.matches("input.execute-search")
      ) {
        event.preventDefault();
        executeCommunitySearch(input);
      }
    };

    const onCommunityResize = () => closeCommunityMenus();

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      handleCommunityHeader(event, target);

      // SAP secondary navigation "More" dropdown (tablet/phone): toggle the
      // same "open" classes SAP's component sets; any other click closes it.
      const moreButton = target.closest<HTMLButtonElement>(".dropdown-nav-tabs-btn");
      document.querySelectorAll<HTMLElement>(".dropdown-nav-tabs").forEach((menu) => {
        const button = menu.querySelector<HTMLButtonElement>(".dropdown-nav-tabs-btn");
        const popover = menu.querySelector<HTMLElement>(".dropdown-nav-tabs-popover");
        if (!button || !popover) return;
        const open = button === moreButton ? !button.classList.contains("open") : false;
        button.classList.toggle("open", open);
        popover.classList.toggle("open", open);
        button.setAttribute("aria-expanded", String(open));
      });

      // SAP "How is your experience with this page?" rating: nothing is sent
      // anywhere in the clone; acknowledge the vote in place.
      const rating = target.closest<HTMLElement>(
        ".FirstQuestion__likeButton--T6BAD, .FirstQuestion__dislikeButton--OnJRt"
      );
      if (rating) {
        const root = rating.closest<HTMLElement>(".FirstQuestion__root--NouWM");
        const heading = root?.querySelector("h5");
        if (heading) heading.textContent = "Thank you for your feedback.";
        root?.querySelector<HTMLElement>(".FirstQuestion__buttonBlock--IMUwK")?.remove();
      }

      const faq = target.closest<HTMLElement>(".faq-q");
      if (faq) {
        const item = faq.closest<HTMLElement>(".faq-item");
        const answer = item?.querySelector<HTMLElement>(".faq-a");
        if (item && answer) {
          const open = item.classList.toggle("open");
          answer.style.display = open ? "block" : "none";
        }
      }

      const tab = target.closest<HTMLElement>("[data-tab]");
      if (tab) {
        const group = tab.getAttribute("data-tab-group");
        const name = tab.getAttribute("data-tab");
        if (group && name) {
          document
            .querySelectorAll<HTMLElement>(`[data-tab-group="${group}"]`)
            .forEach((el) => el.classList.remove("active"));
          tab.classList.add("active");
          document
            .querySelectorAll<HTMLElement>(`[data-panel-group="${group}"]`)
            .forEach((el) => {
              el.style.display = "none";
            });
          const panel = document.querySelector<HTMLElement>(
            `[data-panel-group="${group}"][data-panel="${name}"]`
          );
          if (panel) panel.style.display = "block";
        }
      }

      const footerButton = target.closest<HTMLElement>(".footer-col h4 button");
      if (footerButton && window.innerWidth <= 820) {
        const list = footerButton.closest(".footer-col")?.querySelector<HTMLElement>("ul");
        if (list) list.style.display = list.style.display === "none" ? "block" : "none";
      }
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (form.id !== "contactForm") return;
      event.preventDefault();
      const success = document.getElementById("formSuccess");
      if (success) success.style.display = "block";
      form.reset();
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement;

      if (target.id === "storySearch") {
        const q = target.value.toLowerCase();
        let count = 0;
        document.querySelectorAll<HTMLElement>(".story-card").forEach((card) => {
          const show = card.textContent?.toLowerCase().includes(q) ?? false;
          card.style.display = show ? "" : "none";
          if (show) count++;
        });
        const counter = document.getElementById("storyCount");
        if (counter) counter.textContent = `${count} results`;
      }

      if (target.id === "jobSearch") {
        const q = target.value.toLowerCase();
        let count = 0;
        document.querySelectorAll<HTMLElement>(".job").forEach((job) => {
          const show = job.textContent?.toLowerCase().includes(q) ?? false;
          job.style.display = show ? "grid" : "none";
          if (show) count++;
        });
        const counter = document.getElementById("jobCount");
        if (counter) counter.textContent = `${count} jobs found`;
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onCommunityKeydown);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("input", onInput);
    window.addEventListener("resize", onCommunityResize);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onCommunityKeydown);
      document.removeEventListener("submit", onSubmit);
      document.removeEventListener("input", onInput);
      window.removeEventListener("resize", onCommunityResize);
    };
  }, []);

  if (isExactCanadianSpendPage) {
    return (
      <>
        <ShadowRootHydrator />
        <CapturedRuntimeEnhancer />
        <SecondaryNavSticky />
        <RecentTracker />
        {children}
      </>
    );
  }

  if (isCommunityPage) {
    return (
      <main id="main">
        <ShadowRootHydrator />
        <SecondaryNavSticky />
        <RecentTracker />
        {children}
      </main>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">{t("skipToContent")}</a>

      <header className="site-header">
        <div className="container masthead">
          <Link className="brand" href="/" aria-label={t("home")}>
            <img src="/assets/sap-logo.svg" alt="SAP" />
          </Link>

          <nav className="desktop-nav" aria-label={t("mainNavigation")}>
            {MASTHEAD_MENUS.map((menu) => {
              const open = openMenu === menu.label;
              return (
                <div
                  key={menu.label}
                  className={`nav-item nav-item-${menu.layout}${open ? " open" : ""}`}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExploreOpen(false);
                      setOpenMenu(open ? null : menu.label);
                    }}
                  >
                    {tt(menu.label)}
                  </button>

                  {open && (
                    <MastheadMenuPanel
                      menu={menu}
                      onLinkClick={() => setOpenMenu(null)}
                      tt={tt}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          <div className="masthead-actions">
            <div className="explore-wrap hide-md">
              <button
                type="button"
                className="masthead-text explore-btn"
                aria-expanded={exploreOpen}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenu(null);
                  setExploreOpen((value) => !value);
                }}
              >
                {t("exploreSap")}
              </button>
              {exploreOpen && (
                <MastheadMenuPanel
                  menu={EXPLORE_SAP_MENU}
                  onLinkClick={() => setExploreOpen(false)}
                  tt={tt}
                />
              )}
            </div>
            <button
              type="button"
              id="searchOpen"
              className="masthead-icon hide-md"
              aria-label={t("search")}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
            >
              <Icon name="search" />
            </button>
            <div className="profile-wrap">
              <button
                type="button"
                id="profile"
                className="masthead-icon masthead-avatar hide-md"
                aria-label={
                  account
                    ? t("accountMenuFor", { name: account.displayName })
                    : t("profileLogin")
                }
                aria-expanded={profileOpen || authOpen}
                onClick={() => {
                  if (account) {
                    setProfileOpen((value) => !value);
                  } else {
                    setAuthOpen(true);
                  }
                }}
              >
                <Icon name="employee" />
              </button>
              {profileOpen && account && (
                <ProfileMenu onClose={() => setProfileOpen(false)} />
              )}
            </div>
            <RegionSwitcher />
            <button
              type="button"
              id="menuToggle"
              className="masthead-icon menu-toggle"
              aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        <div
          className={`mobile-panel${mobileOpen ? " show" : ""}`}
          id="mobilePanel"
        >
          {MOBILE_NAV.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMobileOpen(false)}>
              {tt(label)}
            </Link>
          ))}
          {account ? (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
            >
              {t("myAccount")} — {account.displayName}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setAuthOpen(true);
              }}
            >
              {t("loginOrSignUp")}
            </button>
          )}
        </div>
      </header>

      {countryBannerVisible && (
        <section className="sap-country-banner" aria-label={t("countrySelector")}>
          <div className="sap-country-banner-inner">
            <p>{t("countryBannerText")}</p>
            <div className="sap-country-banner-actions">
              <Link className="sap-country-btn sap-country-btn-primary" href="/regions">
                <img
                  src="/assets/sa-flag.png"
                  srcSet="/assets/sa-flag.png 1x, /assets/sa-flag@2x.png 2x"
                  alt={region?.siteName ?? "SAP MENA"}
                  width={24}
                  height={24}
                />
                <span>{region?.siteName ?? "SAP MENA"}</span>
              </Link>
              <button
                type="button"
                className="sap-country-btn sap-country-btn-secondary"
                onClick={() => setCountryBannerVisible(false)}
              >
                {t("stayOnLocalSite", { site: region?.siteName ?? "SAP MENA" })}
              </button>
            </div>
            <button
              type="button"
              className="sap-country-close"
              aria-label={t("close")}
              onClick={() => setCountryBannerVisible(false)}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M12.2 13a.8.8 0 0 1-.57-.23L8 9.14l-3.63 3.63a.8.8 0 1 1-1.13-1.13L6.87 8 3.24 4.37A.8.8 0 1 1 4.37 3.24L8 6.87l3.63-3.63A.8.8 0 1 1 12.76 4.37L9.13 8l3.63 3.63c.31.31.31.82 0 1.13A.8.8 0 0 1 12.2 13Z" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {searchOpen && (
        <div
          className="search-overlay show"
          id="searchOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("searchSap")}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="search-panel">
            <form
              id="searchForm"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                id="searchInput"
                type="search"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                autoComplete="off"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                id="searchClose"
                onClick={() => setSearchOpen(false)}
              >
                {t("cancel")}
              </button>
            </form>
            <div className="search-results" id="searchResults">
              {results.length > 0 ? (
                results.map(([label, href, description]) => (
                  <Link key={label} href={href} onClick={() => setSearchOpen(false)}>
                    {tt(label)}
                    <small>{tt(description)}</small>
                  </Link>
                ))
              ) : (
                <p className="text-muted" style={{ padding: 10 }}>
                  {t("noResultsFound")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {authOpen && <LoginDialog onClose={() => setAuthOpen(false)} />}

      <main id="main">
        <ShadowRootHydrator />
        <SecondaryNavSticky />
        <RecentTracker />
        {children}
      </main>

      <footer
        id="footer"
        className="sap-footer"
        onClick={(event) => {
          // Phone/tablet accordion: toggle the column SAP-style (opened class
          // on the opener row, arrow rotated down, aria-expanded).
          const opener = (event.target as HTMLElement).closest<HTMLButtonElement>(
            ".footer-mobile-opener"
          );
          if (opener) {
            const open = opener.getAttribute("aria-expanded") !== "true";
            opener.setAttribute("aria-expanded", String(open));
            opener
              .closest(".NavigationColumn__accordionOpener--QaM_S")
              ?.classList.toggle("NavigationColumn__opened--iB5Kj", open);
            opener
              .querySelector(".NavigationColumn__icon--P8cLc")
              ?.classList.toggle("NavigationColumn__arrowDown--T66cF", open);
            return;
          }
          const link = (event.target as HTMLElement).closest("a");
          if (!link) return;
          if (link.classList.contains("BackToTop__root--fBHC3")) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else if (link.getAttribute("href") === "#") {
            event.preventDefault()