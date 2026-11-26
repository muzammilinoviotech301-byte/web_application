/* eslint-disable @next/next/no-img-element -- country flags are SAP-hosted images */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import {
  SELECTOR_REGIONS,
  activeCountryForHref,
  countryLabel,
  selectorRegionForHref,
  type CountryEntry,
  type SelectorRegion,
} from "@/data/country-selector";
import { localizedHref } from "@/data/regions";

const WORLD_ICON =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.14 6.535H1.666a6.785 6.785 0 0 0 0 2.93h2.476a10.104 10.104 0 0 1 0-2.93Zm1.91 4.43c.574 1.675 1.496 3 1.907 3.533h.085c.41-.533 1.334-1.858 1.907-3.533H6.051ZM2.206 9.465a6.456 6.456 0 0 0 3.707 3.196 13.702 13.702 0 0 1-1.436-3.196H2.206Zm9.317 0a13.695 13.695 0 0 1-1.437 3.196 6.455 6.455 0 0 0 3.708-3.196h-2.27Zm-1.437-9.127a13.697 13.697 0 0 1 1.437 3.197h2.27a6.456 6.456 0 0 0-3.707-3.197ZM7.957 1.5c-.41.533-1.332 1.858-1.906 3.534h3.898C9.375 3.36 8.453 2.033 8.042 1.501h-.085ZM5.913 1.837A6.456 6.456 0 0 0 2.206 5.034h2.27a13.704 13.704 0 0 1 1.437-3.197ZM5.66 9.465h4.68a8.639 8.639 0 0 0 0-2.93H5.66a8.64 8.64 0 0 0 0 2.93Zm6.2 0h2.475a6.787 6.787 0 0 0 0-2.93h-2.476a10.06 10.06 0 0 1 0 2.93ZM16 8a7.964 7.964 0 0 1-7.41 7.976 7.64 7.64 0 0 1-1.182 0A7.964 7.964 0 0 1 0 8 7.964 7.964 0 0 1 7.408.024a7.903 7.903 0 0 1 1.183 0A7.964 7.964 0 0 1 16 8Z"/></svg>';

// sap.com keeps only these parameters when it rewrites a URL for a new country.
const REMAINING_URL_PARAMETERS = new Set([
  "tag",
  "sort",
  "search",
  "currentLevel",
  "mode",
  "regionCode",
  "dataCenterId",
  "solutionId",
]);

export default function RegionSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { region, t } = useLocale();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"regions" | "countries">("regions");
  const [activeRegionId, setActiveRegionId] = useState<string>(
    () => selectorRegionForHref(region?.href)?.id ?? SELECTOR_REGIONS[0].id
  );
  const [query, setQuery] = useState("");
  const [failedFlag, setFailedFlag] = useState<string | null>(null);
  const [listScrollable, setListScrollable] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const regionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeCountry = activeCountryForHref(region?.href)?.country;
  const activeRegion: SelectorRegion =
    SELECTOR_REGIONS.find((item) => item.id === activeRegionId) ??
    SELECTOR_REGIONS[0];

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCountries = useMemo(() => {
    if (!normalizedQuery) return activeRegion.countries;
    return activeRegion.countries.filter((country) =>
      countryLabel(country).toLowerCase().includes(normalizedQuery)
    );
  }, [activeRegion, normalizedQuery]);

  const liveMessage = !normalizedQuery
    ? ""
    : visibleCountries.length > 0
      ? `${visibleCountries.length} ${t("resultsReturned")}`
      : t("noMatchesFound");

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // The UDEX selector moves focus to the back row, or to the region that was
  // just opened, whenever it changes view.
  useEffect(() => {
    if (!open) return;
    if (view === "countries") {
      backRef.current?.focus();
      return;
    }
    const index = SELECTOR_REGIONS.findIndex((item) => item.id === activeRegionId);
    regionRefs.current[index >= 0 ? index : 0]?.focus();
  }, [open, view, activeRegionId]);

  useEffect(() => {
    const element = listRef.current;
    if (!element || view !== "countries") {
      setListScrollable(false);
      return;
    }
    const update = () =>
      setListScrollable(
        element.scrollHeight - element.scrollTop - element.clientHeight > 1
      );
    update();
    element.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open, view, visibleCountries.length]);

  function toggleOpen() {
    if (!open) {
      const current = selectorRegionForHref(region?.href);
      if (current) setActiveRegionId(current.id);
      setView("regions");
      setQuery("");
    }
    setOpen((value) => !value);
  }

  function openCountryList(selectorRegion: SelectorRegion) {
    setActiveRegionId(selectorRegion.id);
    setQuery("");
    setView("countries");
  }

  function backToRegions() {
    setQuery("");
    setView("regions");
  }

  function selectCountry(country: CountryEntry) {
    setOpen(false);
    let suffix = "";
    if (typeof window !== "undefined") {
      const current = new URLSearchParams(window.location.search);
      const remaining = new URLSearchParams();
      for (const key of new Set(current.keys())) {
        if (REMAINING_URL_PARAMETERS.has(key)) {
          remaining.set(key, current.get(key) ?? "");
        }
      }
      const query = remaining.toString();
      suffix = `${query ? `?${query}` : ""}${window.location.hash}`;
    }
    router.push(`${localizedHref(pathname ?? "/", country.href)}${suffix}`);
  }

  return (
    <div className="region-switcher" ref={rootRef}>
      <button
        type="button"
        id="regionSwitcher"
        className="masthead-icon hide-md"
        aria-label={t("countrySelector")}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={activeCountry?.displayTitle ?? region?.label ?? t("regions")}
        onClick={toggleOpen}
      >
        {activeCountry?.flag && failedFlag !== activeCountry.flag ? (
          <img
            className="region-switcher-flag"
            src={activeCountry.flag}
            alt=""
            aria-hidden="true"
            onError={() => setFailedFlag(activeCountry.flag ?? null)}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{ display: "inline-flex" }}
            dangerouslySetInnerHTML={{ __html: WORLD_ICON }}
          />
        )}
      </button>

      {open && (
        <div
          className="region-switcher-panel"
          role="dialog"
          aria-label={t("countrySelector")}
        >
          <div
            className={`region-switcher-head${
              view === "regions" ? " region-switcher-head-bordered" : ""
            }`}
          >
            <span className="region-switcher-title">
              {view === "regions"
                ? t("chooseYourRegion")
                : t("chooseYourCountry")}
            </span>
          </div>

          {view === "regions" ? (
            <ul className="region-switcher-list">
              {SELECTOR_REGIONS.map((selectorRegion, index) => (
                <li key={selectorRegion.id}>
                  <button
                    ref={(element) => {
                      regionRefs.current[index] = element;
                    }}
                    type="button"
                    className="region-switcher-region"
                    aria-haspopup="true"
                    onClick={() => openCountryList(selectorRegion)}
                  >
                    <span>{t(selectorRegion.labelKey)}</span>
                    <span className="region-switcher-chevron" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <button
                ref={backRef}
                type="button"
                className="region-switcher-back"
                aria-label={`${t(activeRegion.labelKey)} ${t("backToRegions")}`}
                onClick={backToRegions}
              >
                <span className="region-switcher-back-icon" aria-hidden="true" />
                <span>{t(activeRegion.labelKey)}</span>
              </button>

              <div className="region-switcher-search">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("searchCountries")}
                  aria-label={t("searchCountries")}
                />
                {query && (
                  <button
                    type="button"
                    className="region-switcher-search-clear"
                    aria-label={t("close")}
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                  />
                )}
              </div>

              <span
                aria-live="polite"
                aria-atomic="true"
                className="region-switcher-sr-only"
              >
                {liveMessage}
              </span>

              <div
                ref={listRef}
                className={`region-switcher-list-wrap${
                  listScrollable ? " region-switcher-list-wrap-scrollable" : ""
                }`}
              >
                <ul
                  className="region-switcher-list region-switcher-list-countries"
                  role="menu"
                >
                  {visibleCountries.map((country) => {
                    const isActive =
                      !!activeCountry &&
                      activeCountry.countryCode.toUpperCase() ===
                        country.countryCode.toUpperCase() &&
                      activeCountry.sapUrl.toUpperCase() ===
                        country.sapUrl.toUpperCase();
                    return (
                      <li role="none" key={`${country.countryCode}-${country.sapUrl}`}>
                        <button
                          type="button"
                          role="menuitem"
                          className={`region-switcher-country${
                            isActive ? " active" : ""
                          }`}
                          onClick={() => selectCountry(country)}
                        >
                          {countryLabel(country)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
