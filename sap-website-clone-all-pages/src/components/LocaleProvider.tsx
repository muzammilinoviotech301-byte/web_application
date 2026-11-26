"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  isRtlLanguage,
  translate,
  translateText,
  type TranslationKey,
} from "@/data/i18n";
import { regionFromPathname, type Region } from "@/data/regions";

type LocaleContextValue = {
  region: Region | undefined;
  language: string;
  t: (
    key: TranslationKey,
    vars?: Record<string, string | number>
  ) => string;
  /** Translate a string captured in the data files when it has a known key. */
  tt: (text: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const region = useMemo(
    () => regionFromPathname(pathname ?? "/"),
    [pathname]
  );
  const language = region?.language ?? "en";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      region,
      language,
      t: (key, vars) => translate(language, key, vars),
      tt: (text) => translateText(language, text),
    }),
    [region, language]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}
