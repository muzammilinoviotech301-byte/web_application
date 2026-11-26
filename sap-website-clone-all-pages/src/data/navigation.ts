import { PAGE_CATALOG } from "./page-catalog";
import { REGIONS } from "./regions";

export type NavLink = [label: string, href: string];

export type NavItem = {
  label: string;
  href: string;
  mega?: {
    columns: Array<{ title: string; links: NavLink[] }>;
    feature: { title: string; text: string; img: string; href: string };
  };
};

export const PRIMARY_NAV: NavItem[] = [
  {
    label: "Products",
    href: "/products",
    mega: {
      columns: [
        {
          title: "Business AI",
          links: [
            ["Joule assistants", "/products/artificial-intelligence/ai-assistant"],
            ["Joule work", "/products/artificial-intelligence/joule-work"],
            ["Joule Studio", "/products/artificial-intelligence/joule-studio"],
            ["AI models and services", "/products/artificial-intelligence/ai-models"],
            ["AI Agent Hub", "/products/artificial-intelligence/ai-agent-hub"],
          ],
        },
        {
          title: "Applications",
          links: [
            ["Cloud ERP", "/products/erp"],
            ["Financial management", "/products/financial-management"],
            ["Spend management", "/products/spend-management"],
            ["Supply chain management", "/products/scm"],
            ["Human capital management", "/products/hcm"],
            ["Customer experience", "/products/crm"],
          ],
        },
        {
          title: "Platform & data",
          links: [
            ["SAP Integration Suite", "/products/technology-platform/integration-suite"],
            ["SAP Business Data Cloud", "/products/data-cloud"],
            ["Business transformation", "/products/business-transformation-management"],
            ["Sustainability", "/products/sustainability"],
            ["SAP Business Network", "/products/business-network"],
          ],
        },
        {
          title: "More offerings",
          links: [
            ["RISE with SAP", "/products/erp/rise"],
            ["GROW with SAP", "/products/erp/grow"],
            ["SAP Cloud ERP Private", "/products/erp/cloud-erp-private"],
            ["Use cases", "/use-cases"],
            ["All products A–Z", "/products"],
          ],
        },
      ],
      feature: {
        title: "SAP Cloud ERP Private",
        text: "Run your core business with confidence—today and tomorrow.",
        img: "/assets/hero-joule.jpg",
        href: "/products/erp/cloud-erp-private",
      },
    },
  },
  {
    label: "Industries",
    href: "/industries",
    mega: {
      columns: [
        {
          title: "Explore industries",
          links: [
            ["Industry AI solutions", "/industries"],
            ["Use cases", "/use-cases"],
            ["Customer stories", "/customers"],
            ["SAP Business Network", "/products/business-network"],
          ],
        },
        {
          title: "Solutions",
          links: [
            ["Supply chain management", "/products/scm"],
            ["Sustainability", "/products/sustainability"],
            ["Financial management", "/products/financial-management"],
            ["Customer experience", "/products/crm"],
          ],
        },
        {
          title: "Events",
          links: [
            ["SAP Sapphire", "/events/sapphire"],
            ["SAP TechEd", "/events/teched"],
            ["SAP Connect", "/events/connect"],
          ],
        },
        {
          title: "Learn more",
          links: [
            ["Technology topics", "/topics"],
            ["SAP Help Portal", "/help"],
            ["SAP News", "/news"],
          ],
        },
      ],
      feature: {
        title: "Industry AI solutions from SAP",
        text: "Solve complex business challenges with industry-specific AI.",
        img: "/assets/build.jpg",
        href: "/industries",
      },
    },
  },
  {
    label: "Transform and Support",
    href: "/support",
    mega: {
      columns: [
        {
          title: "Services and support",
          links: [
            ["SAP Services and Support", "/support"],
            ["SAP Help Portal", "/help"],
            ["Contact us", "/contact"],
          ],
        },
        {
          title: "Transformation",
          links: [
            ["Business transformation management", "/products/business-transformation-management"],
            ["RISE with SAP", "/products/erp/rise"],
            ["GROW with SAP", "/products/erp/grow"],
          ],
        },
        {
          title: "Learn",
          links: [
            ["SAP Learning", "/learning"],
            ["SAP TechEd", "/events/teched"],
            ["Technology topics", "/topics"],
          ],
        },
        {
          title: "Community",
          links: [
            ["SAP Community", "/community"],
            ["Customer stories", "/customers"],
            ["Trust Center", "/about/trust-center"],
          ],
        },
      ],
      feature: {
        title: "Orchestrating your success",
        text: "Guidance, engagement, and continuity for every stage of your journey.",
        img: "/assets/govern.jpg",
        href: "/support",
      },
    },
  },
  {
    label: "Learning",
    href: "/learning",
    mega: {
      columns: [
        {
          title: "Get started",
          links: [
            ["SAP Learning", "/learning"],
            ["SAP Help Portal", "/help"],
            ["SAP TechEd", "/events/teched"],
          ],
        },
        {
          title: "Product learning",
          links: [
            ["Cloud ERP", "/products/erp"],
            ["Joule Studio", "/products/artificial-intelligence/joule-studio"],
            ["SAP Integration Suite", "/products/technology-platform/integration-suite"],
          ],
        },
        {
          title: "Inspiration",
          links: [
            ["Technology topics", "/topics"],
            ["Customer stories", "/customers"],
            ["SAP Community", "/community"],
          ],
        },
        {
          title: "Events",
          links: [
            ["SAP Sapphire", "/events/sapphire"],
            ["SAP Connect", "/events/connect"],
            ["News", "/news"],
          ],
        },
      ],
      feature: {
        title: "Build skills for what's next",
        text: "Learn at your own pace with journeys built for every role.",
        img: "/assets/contextualize.jpg",
        href: "/learning",
      },
    },
  },
  {
    label: "Community",
    href: "/community",
    mega: {
      columns: [
        {
          title: "Connect",
          links: [
            ["SAP Community", "/community"],
            ["Technology topics", "/topics"],
            ["Customer stories", "/customers"],
          ],
        },
        {
          title: "Events",
          links: [
            ["SAP Sapphire", "/events/sapphire"],
            ["SAP TechEd", "/events/teched"],
            ["SAP Connect", "/events/connect"],
          ],
        },
        {
          title: "News",
          links: [
            ["SAP News", "/news"],
            ["About SAP", "/about"],
            ["Investor Relations", "/investors"],
          ],
        },
        {
          title: "Careers",
          links: [
            ["Careers at SAP", "/careers"],
            ["Contact us", "/contact"],
          ],
        },
      ],
      feature: {
        title: "Ask the community",
        text: "Find answers, share expertise, and build connections.",
        img: "/assets/partners.jpg",
        href: "/community",
      },
    },
  },
  {
    label: "Partners",
    href: "/partners",
    mega: {
      columns: [
        {
          title: "Work with us",
          links: [
            ["Partners and SAP Store", "/partners"],
            ["Find a partner", "/partners"],
            ["SAP Business Network", "/products/business-network"],
          ],
        },
        {
          title: "Solutions",
          links: [
            ["Partner solutions", "/products/erp/grow"],
            ["RISE with SAP", "/products/erp/rise"],
            ["Customer stories", "/customers"],
          ],
        },
        {
          title: "Resources",
          links: [
            ["Partner events", "/events/sapphire"],
            ["SAP News", "/news"],
            ["Technology topics", "/topics"],
          ],
        },
        {
          title: "Explore",
          links: [
            ["About SAP", "/about"],
            ["Contact us", "/contact"],
          ],
        },
      ],
      feature: {
        title: "Accelerate success together",
        text: "Find the right partner to identify, build, and run SAP solutions.",
        img: "/assets/find-partner.jpg",
        href: "/partners",
      },
    },
  },
  {
    label: "About",
    href: "/about",
    mega: {
      columns: [
        {
          title: "Company",
          links: [
            ["About SAP", "/about"],
            ["Investor Relations", "/investors"],
            ["Trust Center", "/about/trust-center"],
            ["Careers at SAP", "/careers"],
          ],
        },
        {
          title: "News & stories",
          links: [
            ["SAP News", "/news"],
            ["Customer stories", "/customers"],
            ["Technology topics", "/topics"],
          ],
        },
        {
          title: "Events",
          links: [
            ["SAP Sapphire", "/events/sapphire"],
            ["SAP TechEd", "/events/teched"],
            ["SAP Connect", "/events/connect"],
          ],
        },
        {
          title: "Contact",
          links: [
            ["Contact us", "/contact"],
            ["Site information", "/legal"],
          ],
        },
      ],
      feature: {
        title: "Bring out your best",
        text: "Work on technology that helps the world run better.",
        img: "/assets/become-partner.jpg",
        href: "/careers",
      },
    },
  },
];

export const MOBILE_NAV: NavLink[] = [
  ...PRIMARY_NAV.map((item) => [item.label, item.href] as NavLink),
  ["Customers", "/customers"],
  ["Events", "/events/sapphire"],
  ["News", "/news"],
  ["Help Portal", "/help"],
  ["Careers", "/careers"],
  ["Contact us", "/contact"],
  ["Regions", "/regions"],
  ["All pages", "/all-pages"],
];

export const FOOTER_COLUMNS = [
  {
    title: "Quick links",
    links: [
      ["SAP Trust Center", "/about/trust-center"],
      ["SAP Store", "/partners"],
      ["All products A–Z", "/products"],
      ["Use Cases", "/use-cases"],
      ["Technology Topics", "/topics"],
      ["SAP Help Portal", "/help"],
      ["Find services", "/support"],
      ["Worldwide sites", "/regions"],
      ["All pages", "/all-pages"],
      ["Contact us", "/contact"],
    ] as NavLink[],
  },
  {
    title: "Trending",
    links: [
      ["Joule assistants", "/products/artificial-intelligence/ai-assistant"],
      ["Joule Studio", "/products/artificial-intelligence/joule-studio"],
      ["SAP Business Data Cloud", "/products/data-cloud"],
      ["RISE with SAP", "/products/erp/rise"],
      ["GROW with SAP", "/products/erp/grow"],
      ["SAP Cloud ERP Private", "/products/erp/cloud-erp-private"],
      ["SAP Sapphire", "/events/sapphire"],
      ["SAP TechEd", "/events/teched"],
    ] as NavLink[],
  },
  {
    title: "About SAP",
    links: [
      ["Company information", "/about"],
      ["Investor Relations", "/investors"],
      ["Careers", "/careers"],
      ["News and press", "/news"],
      ["Customer stories", "/customers"],
      ["Events", "/events/sapphire"],
      ["SAP Community", "/community"],
    ] as NavLink[],
  },
  {
    title: "Site information",
    links: [
      ["Privacy", "/legal"],
      ["Terms of use", "/legal"],
      ["Legal disclosure", "/legal"],
      ["Copyright", "/legal"],
      ["Trademark", "/legal"],
      ["Cookie statement", "/legal"],
      ["Cookie preferences", "/legal"],
    ] as NavLink[],
  },
];

const CURATED_SEARCH_INDEX: Array<[label: string, href: string, description: string]> = [
  ["Worldwide sites", "/regions", "All SAP country and regional sites"],
  ["All pages", "/all-pages", "Browse every captured local SAP page"],
  ...REGIONS.map(
    ([label, href, locale]) =>
      [label, href, `SAP regional site - ${locale}`] as [string, string, string]
  ),
  ["SAP Cloud ERP Private", "/products/erp/cloud-erp-private", "Run your core business with confidence"],
  ["Cloud ERP", "/products/erp", "Enterprise resource planning software"],
  ["Financial management", "/products/financial-management", "Autonomous finance solutions"],
  ["Spend management", "/products/spend-management", "Procurement and expense management"],
  ["Supply chain management", "/products/scm", "Planning, manufacturing, and logistics"],
  ["Human capital management", "/products/hcm", "HR and talent solutions"],
  ["Customer experience", "/products/crm", "CRM, commerce, sales, and service"],
  ["Joule assistants", "/products/artificial-intelligence/ai-assistant", "AI agents and assistants"],
  ["Joule work", "/products/artificial-intelligence/joule-work", "AI workspaces"],
  ["Joule Studio", "/products/artificial-intelligence/joule-studio", "Build AI agents and workflows"],
  ["AI models", "/products/artificial-intelligence/ai-models", "SAP AI services and models"],
  ["AI Agent Hub", "/products/artificial-intelligence/ai-agent-hub", "AI governance and agent management"],
  ["SAP Integration Suite", "/products/technology-platform/integration-suite", "Integration platform as a service"],
  ["SAP Business Data Cloud", "/products/data-cloud", "Business data, analytics, and planning"],
  ["Business transformation", "/products/business-transformation-management", "Tools for AI-driven transformation"],
  ["Sustainability", "/products/sustainability", "Carbon, climate, and circular economy"],
  ["SAP Business Network", "/products/business-network", "B2B collaboration network"],
  ["RISE with SAP", "/products/erp/rise", "Cloud ERP transformation as a service"],
  ["GROW with SAP", "/products/erp/grow", "Cloud ERP for growing businesses"],
  ["Industries", "/industries", "Industry AI solutions from SAP"],
  ["Use cases", "/use-cases", "Turn intent into action with Joule"],
  ["Customer stories", "/customers", "See how companies run better with SAP"],
  ["Partners and SAP Store", "/partners", "Partner ecosystem and marketplace"],
  ["Technology topics", "/topics", "Business and technology insights"],
  ["SAP Sapphire", "/events/sapphire", "Flagship annual event"],
  ["SAP TechEd", "/events/teched", "Premier technical event"],
  ["SAP Connect", "/events/connect", "Annual SAP event"],
  ["About SAP", "/about", "Company overview, leadership, and strategy"],
  ["Investor Relations", "/investors", "Financial reports and stock information"],
  ["Trust Center", "/about/trust-center", "Security, privacy, and compliance"],
  ["SAP Help Portal", "/help", "Official product documentation"],
  ["SAP Learning", "/learning", "Courses and certification"],
  ["SAP Community", "/community", "Blogs, Q&A, and groups"],
  ["SAP News", "/news", "Company news and press releases"],
  ["Careers at SAP", "/careers", "Bring out your best"],
  ["Contact us", "/contact", "Talk to SAP"],
  ["Site information", "/legal", "Privacy, terms, and legal disclosure"],
];

export const SEARCH_INDEX: Array<[label: string, href: string, description: string]> = [
  ...CURATED_SEARCH_INDEX,
  ...PAGE_CATALOG,
].filter(
  (item, index, items) =>
    items.findIndex((candidate) => candidate[1] === item[1]) === index
);
