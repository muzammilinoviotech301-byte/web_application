export type RegionLink = [
  label: string,
  href: string,
  locale: string
];

export const REGIONS: RegionLink[] = [
  ["Germany", "/germany", "German (Germany)"],
  ["Austria", "/austria", "German (Austria)"],
  ["Switzerland – German", "/swiss", "German (Switzerland)"],
  ["Switzerland – French", "/suisse", "French (Switzerland)"],
  ["France", "/france", "French (France, Morocco)"],
  ["UK and Ireland", "/uk", "English (Ireland, United Kingdom)"],
  ["Netherlands", "/netherlands", "Dutch (Netherlands)"],
  ["Belgium – Dutch", "/belgie", "Dutch (Belgium)"],
  ["Belgium – French", "/belgique", "French (Belgium)"],
  ["Spain", "/spain", "Spanish (Spain)"],
  ["Italy", "/italy", "Italian (Italy)"],
  ["Portugal", "/portugal", "Portuguese (Portugal)"],
  ["Sweden", "/sweden", "Swedish (Sweden)"],
  ["Denmark", "/denmark", "Danish (Denmark)"],
  ["Norway", "/norway", "Norwegian (Norway)"],
  ["Finland", "/finland", "Finnish (Finland)"],
  ["Greece and Cyprus", "/greece", "Greek (Cyprus, Greece)"],
  ["Turkey", "/turkey", "Turkish (Turkey)"],
  ["Poland", "/poland", "Polish (Poland)"],
  ["Czech Republic", "/cz", "Czech (Czech Republic)"],
  ["Slovakia", "/sk", "Slovak (Slovakia)"],
  ["Hungary", "/hungary", "Hungarian (Hungary)"],
  ["Romania", "/romania", "Romanian (Romania)"],
  ["Bulgaria", "/bulgaria", "English (Bulgaria)"],
  ["Croatia", "/croatia", "English (Croatia)"],
  ["Slovenia", "/slovenia", "English (Slovenia)"],
  ["Western Balkans", "/westbalkans", "English (Albania, North Macedonia, Serbia)"],
  ["Estonia", "/estonia", "English (Estonia)"],
  ["Latvia", "/latvia", "English (Latvia)"],
  ["Lithuania", "/lithuania", "English (Lithuania)"],
  ["Ukraine", "/ukraine", "Ukrainian (Ukraine)"],
  ["Israel", "/israel", "Hebrew (Israel)"],
  ["Canada – English", "/canada", "English (Canada)"],
  ["Canada – French", "/canada-fr", "French (Canada)"],
  ["Brazil", "/brazil", "Portuguese (Brazil)"],
  ["Latin America", "/latinamerica", "Spanish (Latin America)"],
  ["Middle East and North Africa – English", "/mena", "English (MENA)"],
  ["Middle East and North Africa – Arabic", "/mena-ar", "Arabic (MENA)"],
  ["Sub-Saharan Africa", "/africa", "English (Sub-Saharan Africa)"],
  ["India and Bangladesh", "/india", "English (Bangladesh, India)"],
  ["Central Asia and Caucasus", "/central-asia-caucasus", "Russian (Central Asia and Caucasus)"],
  ["Southeast Asia", "/sea", "English (Southeast Asia)"],
  ["Australia and New Zealand", "/australia", "English (Australia, New Zealand)"],
  ["Hong Kong", "/hk", "English (Hong Kong)"],
  ["Taiwan", "/taiwan", "Chinese Traditional (Taiwan)"],
  ["Japan", "/japan", "Japanese (Japan)"],
  ["South Korea", "/korea", "Korean (South Korea)"],
  ["China", "/china", "Chinese Simplified (China)"],
];

type RegionDetail = {
  /** Base language used by the shared shell and dictionaries. */
  language: string;
  /** Site name shown in the localized country banner. */
  siteName: string;
};

// The third REGIONS tuple entry is display text for the card, not a usable
// locale code. This map is the runtime locale source of truth.
const REGION_DETAILS: Record<string, RegionDetail> = {
  "/germany": { language: "de", siteName: "SAP Deutschland" },
  "/austria": { language: "de", siteName: "SAP Österreich" },
  "/swiss": { language: "de", siteName: "SAP Schweiz" },
  "/suisse": { language: "fr", siteName: "SAP Suisse" },
  "/france": { language: "fr", siteName: "SAP France" },
  "/uk": { language: "en", siteName: "SAP UK & Ireland" },
  "/netherlands": { language: "nl", siteName: "SAP Nederland" },
  "/belgie": { language: "nl", siteName: "SAP België" },
  "/belgique": { language: "fr", siteName: "SAP Belgique" },
  "/spain": { language: "es", siteName: "SAP España" },
  "/italy": { language: "it", siteName: "SAP Italia" },
  "/portugal": { language: "pt", siteName: "SAP Portugal" },
  "/sweden": { language: "sv", siteName: "SAP Sverige" },
  "/denmark": { language: "da", siteName: "SAP Danmark" },
  "/norway": { language: "no", siteName: "SAP Norge" },
  "/finland": { language: "fi", siteName: "SAP Suomi" },
  "/greece": { language: "el", siteName: "SAP Ελλάδα" },
  "/turkey": { language: "tr", siteName: "SAP Türkiye" },
  "/poland": { language: "pl", siteName: "SAP Polska" },
  "/cz": { language: "cs", siteName: "SAP Česká republika" },
  "/sk": { language: "sk", siteName: "SAP Slovensko" },
  "/hungary": { language: "hu", siteName: "SAP Magyarország" },
  "/romania": { language: "ro", siteName: "SAP România" },
  "/bulgaria": { language: "en", siteName: "SAP Bulgaria" },
  "/croatia": { language: "en", siteName: "SAP Croatia" },
  "/slovenia": { language: "en", siteName: "SAP Slovenia" },
  "/westbalkans": { language: "en", siteName: "SAP Western Balkans" },
  "/estonia": { language: "en", siteName: "SAP Estonia" },
  "/latvia": { language: "en", siteName: "SAP Latvia" },
  "/lithuania": { language: "en", siteName: "SAP Lithuania" },
  "/ukraine": { language: "uk", siteName: "SAP Україна" },
  "/israel": { language: "he", siteName: "SAP ישראל" },
  "/canada": { language: "en", siteName: "SAP Canada" },
  "/canada-fr": { language: "fr", siteName: "SAP Canada" },
  "/brazil": { language: "pt", siteName: "SAP Brasil" },
  "/latinamerica": { language: "es", siteName: "SAP Latin America" },
  "/mena": { language: "en", siteName: "SAP MENA" },
  "/mena-ar": { language: "ar", siteName: "SAP MENA" },
  "/africa": { language: "en", siteName: "SAP Africa" },
  "/india": { language: "en", siteName: "SAP India" },
  "/central-asia-caucasus": { language: "ru", siteName: "SAP Central Asia and Caucasus" },
  "/sea": { language: "en", siteName: "SAP Southeast Asia" },
  "/australia": { language: "en", siteName: "SAP Australia and New Zealand" },
  "/hk": { language: "en", siteName: "SAP Hong Kong" },
  "/taiwan": { language: "zh-Hant", siteName: "SAP 台灣" },
  "/japan": { language: "ja", siteName: "SAP 日本" },
  "/korea": { language: "ko", siteName: "SAP 한국" },
  "/china": { language: "zh-Hans", siteName: "SAP 中国" },
};

export type Region = {
  label: string;
  href: string;
  displayLocale: string;
  language: string;
  siteName: string;
};

export function getRegion(href: string): Region | undefined {
  const match = REGIONS.find(([, regionHref]) => regionHref === href);
  if (!match) return undefined;
  const detail = REGION_DETAILS[href] ?? { language: "en", siteName: "SAP" };
  return {
    label: match[0],
    href: match[1],
    displayLocale: match[2],
    language: detail.language,
    siteName: detail.siteName,
  };
}

/** Longest matching region prefix wins (e.g. /canada-fr before /canada). */
export function regionFromPathname(pathname: string): Region | undefined {
  const clean = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const match = REGIONS.filter(
    ([, href]) => clean === href || clean.startsWith(`${href}/`)
  ).sort((a, b) => b[1].length - a[1].length)[0];
  return match ? getRegion(match[1]) : undefined;
}

/** App-owned routes have no localized capture; region selection resets them. */
const APP_ROUTE_SEGMENTS = new Set([
  "account",
  "admin",
  "all-pages",
  "api",
  "community",
  "dashboard",
  "forgot-password",
  "inbox",
  "learning",
  "login",
  "orders",
  "product-login",
  "profile",
  "regions",
  "register",
  "reset-password",
  "shopping-cart",
  "t5",
  "trials",
  "verify-email",
]);

export function stripRegionPrefix(pathname: string): string {
  const clean = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  const region = regionFromPathname(clean);
  if (!region) return clean;
  return clean.slice(region.href.length) || "/";
}

/**
 * Keep the current captured page when switching regions. If the localized
 * capture does not exist, the catch-all route falls back to the global page.
 */
export function localizedHref(pathname: string, regionHref: string): string {
  const base = stripRegionPrefix(pathname);
  const firstSegment = base.split("/")[1];
  const isAppRoute = !!firstSegment && APP_ROUTE_SEGMENTS.has(firstSegment);
  const target = base === "/" || isAppRoute ? "/" : base;
  return target === "/" ? regionHref : `${regionHref}${target}`;
}
