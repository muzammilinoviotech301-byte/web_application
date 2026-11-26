import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_CATALOG } from "@/data/page-catalog";

export const metadata: Metadata = {
  title: "All Captured SAP Pages | Local Private Clone",
  description: "Browse every SAP.com page captured in this local replica.",
};

const GROUP_LABELS: Record<string, string> = {
  about: "About SAP",
  blogs: "SAP Blogs",
  customers: "Customer Stories",
  events: "SAP Events",
  help: "Help Portal",
  industries: "Industries",
  investors: "Investor Relations",
  products: "Products and Solutions",
  research: "SAP Research",
  resources: "Resources and Guides",
  topics: "Technology Topics",
  "use-cases": "Joule Use Cases",
};

function groupForHref(href: string) {
  if (href === "/") return "home";
  return href.split("/").filter(Boolean)[0] || "home";
}

function groupLabel(group: string) {
  return GROUP_LABELS[group] || group.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AllPagesPage() {
  const entries = [...PAGE_CATALOG].sort((a, b) => a[0].localeCompare(b[0]));
  const groups = new Map<string, typeof entries>();

  for (const entry of entries) {
    const group = groupForHref(entry[1]);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(entry);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) =>
    groupLabel(a[0]).localeCompare(groupLabel(b[0]))
  );

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="eyebrow">Local archive</div>
          <h1>Every captured SAP page</h1>
          <p>
            A complete directory of the {PAGE_CATALOG.length} SAP.com pages saved
            in this private local replica. Use the search control in the header
            or browse by section below.
          </p>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-head">
            <h2>Browse by section</h2>
            <p className="text-muted">{sortedGroups.length} sections</p>
          </div>
          <div className="grid grid-4">
            {sortedGroups.map(([group, items]) => (
              <a className="card" key={group} href={`#${group}`}>
                <h3>{groupLabel(group)}</h3>
                <p>{items.length} captured page{items.length === 1 ? "" : "s"}</p>
                <span className="btn-link">Jump to section →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {sortedGroups.map(([group, items]) => (
        <section className="section" id={group} key={group}>
          <div className="container">
            <div className="section-head">
              <h2>{groupLabel(group)}</h2>
              <p className="text-muted">{items.length} pages</p>
            </div>
            <div className="grid grid-3">
              {items.map(([label, href, description]) => (
                <Link className="card" key={href} href={href}>
                  <h3>{label}</h3>
                  <p>{description || href}</p>
                  <span className="btn-link">Open page →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
