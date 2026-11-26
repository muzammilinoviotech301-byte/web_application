# SAP Public Website Clone - Research and Implementation Architecture

**Status:** Research only. No implementation work was started.  
**Prepared:** 2026-11-22  
**Application:** `sap-website-clone`  
**Reference source:** `sap-references`

## 1. Executive Summary

The recommended implementation is a Next.js 16 App Router site using React 19, TypeScript, Tailwind's existing baseline, and SAP Fundamental Styles for the SAP visual and interaction vocabulary. Build reusable React components around focused Fundamental Styles CSS imports rather than importing an entire enterprise framework or copying a reference application.

The public SAP.com experience should be represented as a polished static/content-led marketing website with local or Supabase-backed demo content. It must not claim to call real SAP APIs or reproduce SAP backend behavior unless those integrations are separately specified and approved.

## 2. Research Scope and Evidence Limits

### Inspected

- `sap-references/fundamental-styles`
- `sap-references/fundamental`
- `sap-references/openui5`
- `sap-references/spartacus`
- `sap-references/ui5-webcomponents`
- The existing `sap-website-clone` Next.js project
- Official SAP public web search results and official SAP design-system documentation

### Public website limitation

Direct requests to `https://www.sap.com` returned HTTP 403 in the available environment. The public-site structure below therefore combines official indexed SAP pages, official SAP sitemap results, and established public navigation patterns. It is a reconstruction for implementation planning, not a machine-extracted snapshot. Before visual implementation, capture approved screenshots or a provided reference set to freeze exact copy, imagery, and section order.

### Repository rules followed

- Reference repositories were read only.
- No reference source was copied wholesale.
- No implementation dependencies were installed.
- No existing application files were overwritten.
- No SAP API or backend functionality was invented.

## 3. Reference Repository Analysis

### 3.1 Fundamental Styles

**Repository role:** Primary design-system candidate.

- Framework-agnostic CSS/component library for SAP-style applications.
- Uses BEM classes such as `fd-button`, `fd-card`, `fd-shellbar`, and `fd-breadcrumb`.
- Includes 120+ components, a machine-readable AI component index, component catalog, design tokens, utility classes, and interaction examples.
- Requires both:
  - `@sap-theming/theming-base-content` CSS variables/fonts
  - `fundamental-styles/dist/theming/sap_horizon.css`
- Provides accessible reference markup and WCAG-oriented guidance.
- Compatible with React and Next.js as CSS plus React components.
- The repository package declares Node 22+ and Yarn 4 for its own development workflow, while the consumer library may work in the existing Next.js environment.
- Apache-2.0 license.

**Useful components and patterns**

| Need | Fundamental Styles component |
|---|---|
| Header shell | `shellbar`, `bar`, `horizontal-navigation` |
| Mega menu/popover | `menu`, `popover`, `navigation-menu`, `navigation-list` |
| Footer | custom React layout using `page-footer`, `layout-grid`, and links |
| Cards | `card`, `tile`, `grid-list`, `carousel` |
| Buttons | `button`, `button-split`, `segmented-button` |
| Forms | `form-item`, `form-label`, `input`, `input-group`, `textarea`, `select`, `form-message` |
| Search | `search-field`, `input-group`, `popover`, `list` |
| Responsive layout | `layout-grid`, `container`, `section`, `page`, `dynamic-side-content` |
| Breadcrumbs | `breadcrumb` |
| Dialog/search overlay | `dialog`, `popover`, `message-box` |
| Feedback | `message-strip`, `message-toast`, `alert`, `busy-indicator` |

**Recommendation:** Use this repository as the visual and semantic reference, importing only required component CSS. Wrap the markup in typed React components.

### 3.2 UI5 Web Components

**Repository role:** Secondary reference for enterprise controls and overlays.

- Framework-neutral custom-element library for buttons, inputs, popovers, cards, tables, menus, search, shell bar, and side navigation.
- Includes `@ui5/webcomponents` for general controls and `@ui5/webcomponents-fiori` for Shell Bar, Side Navigation, Search, Navigation Layout, and Navigation Menu.
- Stable TypeScript declarations and package-level `llms.txt`/custom-element manifests are available.
- Apache-2.0 license.
- The repository is not evidence of a React implementation that is optimized for Next.js App Router.
- The official React wrapper requires React 18 or newer, and Next.js integration is subject to the repository's noted top-level-await limitation.

**Recommendation:** Do not install the web-components runtime as a primary UI dependency in the initial build. Reuse the component vocabulary and interaction patterns only. Reconsider specific controls later when a server/client boundary and browser compatibility test are established.

### 3.3 OpenUI5

**Repository role:** Reference only.

- A complete JavaScript UI framework for enterprise applications.
- Provides mature shell, table, form, layout, dynamic page, and data-binding controls.
- Uses jQuery/OpenUI5 runtime conventions and an application bootstrap model.
- Apache-2.0 license.
- It is not compatible as an architectural replacement for Next.js/React and would add an unnecessary second runtime.

**Recommendation:** Do not install or integrate OpenUI5.

### 3.4 Spartacus

**Repository role:** Conceptual reference only.

- Angular-based SAP Commerce composable storefront.
- Demonstrates storefront features such as page CMS content, search, categories, product details, cart, checkout, and order history.
- Requires SAP Commerce Cloud/Commerce APIs for real product functionality.
- Apache-2.0 license with third-party dependencies and existing `NOTICE.txt`.
- The Angular architecture and Commerce API assumptions do not map to this React/Next.js project.

**Recommendation:** Study architectural ideas such as content-driven pages and feature boundaries, but do not copy or install Spartacus libraries.

### 3.5 Deprecated Fundamental Repository

**Repository role:** Historical reference only.

- Deprecated in favor of Fundamental Styles.
- Apache-2.0 license.

**Recommendation:** Do not use `fiori-fundamentals` or old `fundamental` CSS.

## 4. Library Compatibility Matrix

| Library | Next.js 16 + React 19 | TypeScript | Recommendation |
|---|---|---:|---|
| Fundamental Styles | Direct CSS import is compatible | Components are HTML/CSS, wrapped by typed React | **Primary** |
| `@sap-theming/theming-base-content` | Direct CSS/font assets are compatible | N/A | **Primary** |
| UI5 Web Components | Custom elements can work, but SSR/custom-element hydration needs validation | Stable declarations | **Deferred** |
| UI5 Web Components for React | React integration exists; Next-specific top-level-await limitation is documented | TypeScript | **Deferred** |
| OpenUI5 | No, second framework/runtime | No direct React idiom | **Exclude** |
| Spartacus | No, Angular storefront | Angular/TypeScript | **Exclude** |
| Deprecated Fundamental | Superseded; could coexist but creates duplicate tokens/classes | N/A | **Exclude** |

## 5. License and Usage Requirements

All five primary downloaded repositories identify Apache-2.0 licensing for their main source. Spartacus also contains notices and third-party license information.

### Required project handling

- Preserve Apache-2.0 license text and third-party/NOTICE information for bundled dependencies.
- Keep package licenses intact in the dependency lock and deployment bundle.
- Do not imply that SAP trademark, brand name, logo, or public design assets are licensed for commercial reuse solely because the code is Apache-2.0.
- Use text-based SAP-like branding only with a disclaimer until the user supplies approved brand assets and usage approval.
- Do not scrape or redistribute restricted SAP media, legal copy, logos, or user-facing content.
- Keep reference repositories outside the application source and untouched.
- Reuse component concepts and CSS patterns, not unrelated application code or data.

## 6. Design-System Findings

### Typography

- SAP 72 is the primary typeface in the SAP Horizon/Fiori visual language.
- The repository fallback order is: `72`, `72full`, Arial, Helvetica, sans-serif.
- Headlines commonly use stronger weights such as Semibold/Bold/Black.
- Use a local or licensed 72/72full asset package if supplied; otherwise declare a documented fallback and do not claim exact brand typeface fidelity.
- Existing Next.js Geist fonts should be replaced for the marketing visual implementation.

### Core Horizon token findings

The machine-readable token inventory contains 1,528 Horizon-related tokens. The key semantic tokens are:

- `--sapBackgroundColor`
- `--sapTextColor`
- `--sapLinkColor`
- `--sapBrandColor`
- `--sapPositiveColor`
- `--sapNegativeColor`
- `--sapCriticalColor`
- `--sapInformativeColor`
- `--sapNeutralColor`
- `--sapGroup_ContentBackground`
- `--sapContent_LabelColor`
- `--sapFontFamily`
- `--sapFontSize`
- `--sapElement_Height`
- `--sapElement_Compact_Height`
- `--sapButton_BorderCornerRadius`
- `--sapField_BorderCornerRadius`
- `--sapContent_Shadow1`
- `--sapContent_Shadow2`
- `--sapContent_FocusColor`

Observed token values include:

- Horizon brand: `#0070f2`
- Horizon highlight/selected: `#0064d9`
- Horizon page background: `#f5f6f7`
- Card/content background: `#fff`
- Text/label: use semantic tokens, not fixed ad hoc values
- Legacy Quartz primary: `#0a6ed1`

For public marketing clone fidelity, define a small local token bridge instead of binding every site component to SAP enterprise control internals:

```css
:root {
  --sap-clone-brand: var(--sapBrandColor);
  --sap-clone-link: var(--sapLinkColor);
  --sap-clone-background: #ffffff;
  --sap-clone-surface: var(--sapGroup_ContentBackground);
  --sap-clone-text: var(--sapTextColor);
  --sap-clone-muted: var(--sapContent_LabelColor);
  --sap-clone-focus: var(--sapContent_FocusColor);
}
```

### Layout and spacing

- Use a 16px root size.
- Prefer responsive shell paddings: 1rem small, 2rem medium/large, 3rem extra-large.
- Use CSS grid for page sections and card grids.
- Use container max-width plus 100%/viewport-safe sections.
- Preserve generous editorial spacing for homepage/marketing pages.
- Use compact enterprise controls where forms and menus require them.

### Component guidance

- Use links for navigation and buttons for actions.
- One emphasized button is typically enough for a section.
- Use semantic color classes for success, warning, error, and information.
- Never hide focus states.
- Provide `aria-label`, `aria-expanded`, `aria-controls`, and `aria-current` for navigation.
- Implement Escape, click-outside, focus restoration, and focus trapping for menus/dialogs.
- Use only text and real navigation elements in search result links.

## 7. Public SAP.com Structure Reconstruction

The public SAP.com experience appears to use these major regions:

1. Utility/legal or regional information where applicable.
2. Global shell/header with SAP brand, primary links, search, regional selector, account or sign-in access.
3. Primary navigation categories:
   - Products
   - Solutions
   - Industries
   - Customers
   - Support
   - Learning and training
   - Company/news
4. Large responsive mega menus/overlays with grouped destination lists.
5. Homepage hero with a concise autonomous-enterprise/AI/cloud message and primary CTA.
6. Product, platform, and technology overview cards.
7. Industry and use-case sections.
8. Customer stories and proof points.
9. Announcements and news.
10. Resource, event, partner, and community sections.
11. Large final CTA or trial/contact section.
12. Dense multi-column footer with legal, regional, and policy links.

### Navigation classification

The implementation should use one of these patterns, selected during approval:

- Desktop: top-level horizontal navigation and popover-style mega menus.
- Tablet: condensed top navigation with a left or full-width menu drawer.
- Mobile: accordion-style menu with nested labels and a full-screen search overlay.

## 8. Recommended Component Architecture

### Component stack

- App-level server components for metadata, data fetching, and static rendering.
- Interactive client components only for:
  - Mega menu
  - Mobile navigation
  - Search overlay
  - Search suggestions
  - Dialogs
  - Carousel/tabs
  - Cookie preference UI, if included
- Semantic HTML wrappers with Fundamental Styles classes.
- Lucide icons may remain for marketing-only icons, but SAP icon assets should be preferred for SAP control-style components.

### Project structure

```text
src/
  app/
    layout.tsx
    page.tsx
    products/
      page.tsx
      [slug]/page.tsx
    solutions/
      page.tsx
      [slug]/page.tsx
    industries/
      page.tsx
      [slug]/page.tsx
    support/page.tsx
    learning/page.tsx
    company/page.tsx
    search/page.tsx
    api/
      search/route.ts             # optional, explicitly internal
      leads/route.ts              # optional, only if forms are approved
  components/
    layout/
      Header.tsx
      MegaMenu.tsx
      MobileNavigation.tsx
      Footer.tsx
    marketing/
      Hero.tsx
      SectionHeader.tsx
      CardGrid.tsx
      FeatureBand.tsx
      StoryCard.tsx
      CTA.tsx
    ui/
      Button.tsx
      Link.tsx
      Card.tsx
      SearchField.tsx
      Dialog.tsx
      FormField.tsx
  lib/
    data.ts
    navigation.ts
    search.ts
    supabase/
      client.ts
      server.ts
  data/
    home.ts
    navigation.ts
  styles/
    sap-tokens.css
    sap-components.css
```

The exact paths are proposals for implementation and do not exist yet.

### Design ownership

- Use `sap-tokens.css` for theme variables and page-level token mapping.
- Use `sap-components.css` for selected Fundamental Styles component CSS imports and wrappers.
- Keep page-specific layout in CSS modules or Tailwind utilities.
- Do not copy the entire `fundamental-styles` distribution into application source.

## 9. Frontend Architecture

- Framework: Next.js 16 App Router.
- Language: TypeScript with strict mode.
- Rendering:
  - Server components by default.
  - Static generation for marketing and content pages.
  - Incremental/static revalidation only if Supabase content is enabled.
  - Client components only for interactive islands.
- Routing:
  - `/`
  - `/products`
  - `/products/[slug]`
  - `/solutions`
  - `/solutions/[slug]`
  - `/industries`
  - `/industries/[slug]`
  - `/support`
  - `/learning`
  - `/company`
  - `/search`
  - `/legal/privacy`
  - `/legal/terms`
- Search:
  - Phase 1: generated static search index from local content.
  - Phase 2: optional Supabase full-text search if content administration is requested.
- Accessibility:
  - Semantic landmarks.
  - Skip link.
  - Visible keyboard focus.
  - Correct heading hierarchy.
  - ARIA state synchronization.
  - 44px or equivalent comfortable touch targets on mobile.
- Performance:
  - Next.js image optimization.
  - No layout shift for headers, cards, and logos.
  - Per-component CSS imports.
  - Lazy-load below-the-fold media and carousels.
  - Avoid loading UI5/OpenUI5 runtimes.

## 10. Backend Architecture

No SAP API or real SAP backend should be assumed.

### Initial phase

- Content in typed TypeScript or JSON files.
- Static generation and local search index.
- No mutable database.
- No authentication.
- No server route handlers beyond optional static-friendly utilities.

### Optional Supabase phase

Use the already-installed Supabase SSR and JavaScript packages only after environment variables and table policies are approved.

Proposed content flow:

```text
Supabase CMS tables
  -> server-only Supabase client
  -> Next.js server component
  -> typed content adapter
  -> page/component
```

Proposed app-owned endpoints:

- `GET /api/search?q=...` — local or database-backed clone search only.
- `POST /api/leads` — only for an explicitly approved demo lead/newsletter flow.

Do not proxy real SAP endpoints or store SAP credentials.

### Security plan

- Environment variables exposed only to server code unless explicitly public.
- Row-level security enabled for mutable tables.
- Public read policy only for intentionally public content.
- Server-side validation with Zod when form or route-handler work begins.
- Rate limiting and honeypot or captcha only if real submission storage is implemented.
- No secrets in client bundles or source control.

## 11. Database Plan

The initial implementation should not require a database. The following plan is only for a later content-managed phase.

### Proposed entities

| Table | Purpose |
|---|---|
| `pages` | Page metadata, route, status, published_at |
| `navigation_items` | Header/footer/mega-menu hierarchy |
| `sections` | Ordered page sections and layout variant |
| `cards` | Title, description, image, link, category |
| `stories` | Customer and news story content |
| `products` | Demo product catalog data |
| `industries` | Demo industry content |
| `search_documents` | Normalized search title, summary, keywords, route |
| `leads` | Optional approved form submissions |

### Relationships

- `pages` has many `sections`.
- `sections` has many `cards`.
- `pages` and `cards` have optional image assets.
- `navigation_items` are a self-referencing hierarchy.
- `search_documents` are denormalized records for search.

### RLS policy direction

- Published content: public read.
- Draft content: authenticated administrator read/write.
- Search documents: public read only if a public search index is intended.
- Leads: insert only from server; no public read/update; service-role access limited to server functions.

This is a proposal, not a schema implementation.

## 12. Page-by-Page Implementation Plan

### Homepage

- Two-level header and primary navigation.
- Full-width responsive hero.
- Main CTA and secondary link.
- Featured solution/product card grid.
- AI/autonomous-enterprise content band.
- Industry card grid.
- Customer story band.
- News/resource carousel or grid.
- Final CTA.
- Multi-column footer.

### Products

- Page introduction.
- Category tabs or segmented controls.
- Grouped product cards.
- Search/filter controls.
- Related solution and industry links.
- CTA footer.

### Product detail

- Breadcrumb.
- Product hero.
- Key benefits.
- Feature cards.
- Related resources/customer stories.
- CTA.

### Solutions

- Solution category overview.
- Editorial cards or feature bands.
- Industry-specific filters.
- Case study CTA.

### Industries

- Industry directory.
- Grid of industry cards.
- Featured story.
- Related solutions.

### Industry detail

- Industry hero.
- Challenges and outcomes.
- Solutions list.
- Customer story.
- Resources.

### Support

- Search-first layout.
- Support topics.
- Popular articles.
- Contact/sign-in links.
- Status or alert strip if supplied.

### Learning

- Learning category cards.
- Featured course/event cards.
- Search and filters.
- CTA to external or internal learning destinations.

### Company/news

- Editorial list.
- Filter by type.
- Article/press/news cards.
- Header and footer consistent with homepage.

### Search

- Search input and clear button.
- Optional scope filters.
- Result count.
- Paginated/listed results.
- Empty state.
- Keyboard and screen-reader result announcements.

### Footer/legal

- Large grouped footer links.
- Regional/language selector if approved.
- Privacy, terms, cookie, and legal links.
- Social links only if approved.

## 13. Dependencies to Install

### Core design dependencies

```bash
npm install fundamental-styles @sap-theming/theming-base-content
```

If implementation approves utility/compiled CSS features:

```bash
npm install @fundamental-styles/common-css
```

### Optional implementation dependencies

Only after the relevant feature is approved:

```bash
npm install zod
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
npm install -D prettier
```

Do not install:

- OpenUI5
- Spartacus
- `fiori-fundamentals`
- UI5 Web Components React as a default
- `@ui5/webcomponents` and `@ui5/webcomponents-fiori` on the initial pass
- Every package found in the reference repositories

### Existing dependencies to preserve

- `next`: 16.4.6
- `react`: 19.3.0
- `react-dom`: 19.3.0
- `@supabase/ssr`: 0.12.7
- `@supabase/supabase-js`: 2.119.2
- `lucide-react`: 1.77.0
- Tailwind CSS: 4.3.3
- TypeScript: 5.x

## 14. Development Phases

### Phase A - Visual foundation

1. Import Horizon theme variables and selected Fundamental Styles CSS.
2. Replace Geist with an approved font strategy.
3. Add token bridge and global reset/layout styles.
4. Build `Header`, `MegaMenu`, `MobileNavigation`, `Footer`, `Hero`, `CardGrid`, `CTA`, and form primitives.
5. Add static local navigation/content data.
6. Verify desktop, tablet, mobile, and keyboard behavior.

**Exit evidence:** visual foundation, no implementation of dynamic backend.

### Phase B - Core pages

1. Implement homepage.
2. Implement products, solutions, industries, support, learning, and company routes.
3. Add detail routes and 404/error states.
4. Generate metadata and Open Graph data.
5. Add sitemap and robots.

**Exit evidence:** complete static routes and responsive page parity.

### Phase C - Search and forms

1. Implement static search index.
2. Implement search page and overlay.
3. Add form primitives and validation.
4. Decide whether any lead/subscription table should exist.

**Exit evidence:** search and form behavior work locally without fabricated SAP services.

### Phase D - Optional Supabase content

1. Configure environment variables.
2. Add server-only Supabase clients.
3. Design and approve database migrations.
4. Implement RLS and public read policies.
5. Add content revalidation.

**Exit evidence:** only explicitly approved content is stored/read through Supabase.

### Phase E - Quality and deployment

1. Unit/component tests.
2. Playwright responsive and keyboard tests.
3. Lighthouse/Web Vitals review.
4. Security header/CSP review.
5. License and third-party notice review.
6. Build and deployment smoke tests.

## 15. Quality Gates

Before implementation starts, freeze:

- Approved SAP public visual reference screenshots.
- Exact route/page list.
- Home page copy and section order.
- Approved logo/brand asset usage.
- Font licensing.
- Search scope.
- Form and database requirements.
- Whether the result is a prototype or public-facing clone.
- Final desktop/mobile breakpoints.

Before each implementation phase:

- No reference repository files are modified.
- No extra dependencies are installed outside the approved phase.
- Server/client component boundaries are documented.
- Accessibility behavior is testable.
- No real SAP API names or response contracts are assumed.

## 16. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| SAP public site changes continuously | Freeze screenshots/content for the implementation baseline |
| Exact brand asset unavailable | Use a clear prototype disclaimer and approved asset replacement |
| Fundamental Styles markup is framework-agnostic | Wrap classes in typed React components and test semantics |
| UI5 custom elements create hydration complexity | Exclude until an explicit proof-of-concept is approved |
| CSS/theme duplication | Import only selected theme/component CSS and a single token bridge |
| Backend requirements become speculative | Default to static content; approve Supabase only for real requirements |
| Copyright/trademark misuse | Use original generated copy and approved assets only |
| Accessibility drift | Test focus, landmarks, keyboard navigation, contrast, and mobile targets |

## 17. Final Recommendation

Proceed only after approval with:

- `fundamental-styles`
- `@sap-theming/theming-base-content`
- Existing Next.js, React, Supabase, Tailwind, and Lucide dependencies
- React components that translate selected Fundamental Styles HTML/CSS into accessible TypeScript components
- Static first; Supabase optional and separately scoped
- No OpenUI5, Spartacus, deprecated Fundamental, or UI5 runtime in the initial implementation

This gives a maintainable Next.js architecture while preserving a recognizable SAP/Horizon design language without copying unrelated applications or inventing SAP integrations.
