"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MastheadMenuPanel from "@/components/MastheadMenuPanel";
import { useLocale } from "@/components/LocaleProvider";
import {
  EXPLORE_SAP_MENU,
  MASTHEAD_MENUS,
  type MastheadMenu,
} from "@/data/masthead-menu";

// Captured pages include SAP's masthead markup but not the JavaScript that
// expands its menus. The clone's home page has working React dropdowns; reuse
// the same menu data here so every captured page gets the same navigation.
const MENUS_BY_LABEL = new Map<string, MastheadMenu>(
  [...MASTHEAD_MENUS, EXPLORE_SAP_MENU].map((menu) => [menu.label, menu])
);

type OpenMenu = {
  pathname: string;
  label: string;
  left: number | null;
  top: number;
};

export default function CapturedMastheadMenu() {
  const pathname = usePathname();
  const { tt } = useLocale();
  const [open, setOpen] = useState<OpenMenu | null>(null);
  // Keep the menu tied to the route it was opened on, so navigation closes it
  // without needing an extra effect that sets state during render commits.
  const activeOpen = open?.pathname === pathname ? open : null;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const path = event.composedPath();
      const item = path.find(
        (target): target is HTMLElement =>
          target instanceof HTMLElement && target.tagName === "UDEX-MASTHEAD-ITEM"
      );
      const label = item?.getAttribute("accessible-name") ?? "";
      const menu = MENUS_BY_LABEL.get(label);

      if (item && menu) {
        const rect = item.getBoundingClientRect();
        // Dropdown panels are column-based; keep right-side menus (Explore SAP)
        // inside the viewport instead of letting them overflow the page.
        const columns = menu.columns.filter((column) => !column.row).length;
        const panelWidth = columns * 281 + (columns - 1) * 11 + 63;
        const left = Math.max(
          8,
          Math.min(rect.left - 40, window.innerWidth - panelWidth - 8)
        );
        event.preventDefault();
        event.stopPropagation();
        setOpen((current) =>
          current?.pathname === pathname && current?.label === label
            ? null
            : {
                pathname,
                label,
                left: menu.layout === "mega" ? null : left,
                top: rect.bottom,
              }
        );
        return;
      }

      const insidePanel = path.some(
        (target) =>
          target instanceof HTMLElement &&
          !!target.closest(".captured-masthead-menu-layer")
      );
      if (!insidePanel) setOpen(null);
    };

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };

    // Capture phase is required: the masthead item lives in the light DOM but
    // its clickable button is inside a shadow root.
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeydown, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeydown, true);
    };
  }, [pathname]);

  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>("#header udex-masthead-shell > udex-masthead-item")
      .forEach((item) => {
        const label = item.getAttribute("accessible-name") ?? "";
        const button = item.shadowRoot?.querySelector<HTMLElement>("button");
        button?.setAttribute("aria-expanded", String(activeOpen?.label === label));
      });
  }, [activeOpen]);

  if (!activeOpen) return null;

  const menu = MENUS_BY_LABEL.get(activeOpen.label);
  if (!menu) return null;

  return createPortal(
    <div className="captured-masthead-menu-layer">
      <MastheadMenuPanel
        menu={menu}
        onLinkClick={() => setOpen(null)}
        tt={tt}
        style={
          menu.layout === "mega"
            ? undefined
            : { left: activeOpen.left ?? 0, top: activeOpen.top, right: "auto" }
        }
      />
    </div>,
    document.body
  );
}
