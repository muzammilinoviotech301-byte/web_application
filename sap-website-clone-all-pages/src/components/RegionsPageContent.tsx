"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { REGIONS } from "@/data/regions";

export default function RegionsPageContent() {
  const { t } = useLocale();

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="eyebrow">{t("worldwide")}</div>
          <h1>{t("regionalSites")}</h1>
          <p>{t("regionsIntro")}</p>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-head">
            <h2>{t("allRegions")}</h2>
            <p className="text-muted">
              {t("localizedSites", { count: REGIONS.length })}
            </p>
          </div>
          <div className="grid grid-4">
            {REGIONS.map(([label, href, locale]) => (
              <Link className="card" key={href} href={href}>
                <h3>{label}</h3>
                <p>{locale}</p>
                <span className="btn-link">{t("openSite")}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
