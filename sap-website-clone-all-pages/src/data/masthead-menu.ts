// Masthead menus captured from the live sap.com/mena header (UDEX masthead).
// "mega" menus span the full width under the bar; "dropdown" menus open under
// their button. Links point at local clone routes where a captured page exists.

export type MenuLink = { label: string; href: string; external?: boolean };
export type MenuGroup = { label?: string; links: MenuLink[] };
export type MenuColumn = { title?: string; titleHref?: string; row?: number; groups: MenuGroup[] };
export type MastheadMenu = {
  label: string;
  layout: "mega" | "dropdown";
  title?: string;
  columns: MenuColumn[];
};

export const MASTHEAD_MENUS: MastheadMenu[] = [
  {
    "label": "Products",
    "layout": "mega",
    "columns": [
      {
        "title": "Applications",
        "groups": [
          {
            "links": [
              {
                "label": "Financial management",
                "href": "/products/financial-management"
              },
              {
                "label": "Spend management",
                "href": "/products/spend-management"
              },
              {
                "label": "Supply chain management",
                "href": "/products/scm"
              },
              {
                "label": "Human capital management",
                "href": "/products/hcm"
              },
              {
                "label": "Customer experience",
                "href": "/products/crm"
              },
              {
                "label": "Enterprise resource planning",
                "href": "/products/erp"
              }
            ]
          }
        ],
        "titleHref": "/products/business-applications"
      },
      {
        "title": "AI platform",
        "groups": [
          {
            "label": "BUILD",
            "links": [
              {
                "label": "Develop",
                "href": "/products/artificial-intelligence/joule-studio"
              },
              {
                "label": "Integrate",
                "href": "/products/technology-platform/integration-suite"
              }
            ]
          },
          {
            "label": "CONTEXTUALIZE AND REASON",
            "links": [
              {
                "label": "Data and analytics",
                "href": "/products/data-cloud"
              },
              {
                "label": "AI models",
                "href": "/products/artificial-intelligence/ai-models"
              }
            ]
          },
          {
            "label": "GOVERN",
            "links": [
              {
                "label": "AI agent governance",
                "href": "/products/artificial-intelligence/ai-agent-hub"
              },
              {
                "label": "Transformation management",
                "href": "/products/business-transformation-management"
              }
            ]
          }
        ],
        "titleHref": "/products/ai-platform"
      },
      {
        "title": "Artificial intelligence",
        "groups": [
          {
            "links": [
              {
                "label": "Joule Work",
                "href": "/products/artificial-intelligence/joule-work"
              },
              {
                "label": "Joule agents and assistants",
                "href": "/products/artificial-intelligence/ai-agents"
              }
            ]
          }
        ],
        "titleHref": "/products/artificial-intelligence"
      },
      {
        "title": "More SAP offerings",
        "groups": [
          {
            "links": [
              {
                "label": "RISE with SAP",
                "href": "/products/erp/rise"
              },
              {
                "label": "Midsize business solutions",
                "href": "/products/erp/grow"
              },
              {
                "label": "Sustainability management",
                "href": "/products/sustainability"
              },
              {
                "label": "Business network",
                "href": "/products/business-network"
              },
              {
                "label": "Mobile apps",
                "href": "/products/mobile/applications"
              },
              {
                "label": "All products A-Z",
                "href": "/products/a-z"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "label": "Industries",
    "layout": "mega",
    "columns": [
      {
        "title": "Industry AI",
        "groups": [
          {
            "links": [
              {
                "label": "Autonomous Adaptive Production",
                "href": "/industries/autonomous-adaptive-production"
              },
              {
                "label": "Autonomous Asset Management",
                "href": "/industries/autonomous-asset-management"
              },
              {
                "label": "Autonomous Commodity Management",
                "href": "/industries/autonomous-commodity-management"
              },
              {
                "label": "Autonomous Project Delivery",
                "href": "/industries/autonomous-project-delivery"
              },
              {
                "label": "Autonomous Regulated Manufacturing",
                "href": "/industries/autonomous-regulated-manufacturing"
              },
              {
                "label": "Autonomous Revenue Growth Management",
                "href": "/industries/autonomous-revenue-growth-management"
              },
              {
                "label": "Autonomous Unified Commerce",
                "href": "/industries/autonomous-unified-commerce"
              }
            ]
          }
        ],
        "titleHref": "/industries"
      },
      {
        "title": "Consumer industries",
        "groups": [
          {
            "links": [
              {
                "label": "Agribusiness",
                "href": "/industries/agribusiness"
              },
              {
                "label": "Consumer products",
                "href": "/industries/consumer-products"
              },
              {
                "label": "Life sciences",
                "href": "/industries/life-sciences"
              },
              {
                "label": "Retail",
                "href": "/industries/retail"
              },
              {
                "label": "Wholesale distribution",
                "href": "/industries/wholesale-distribution"
              }
            ]
          }
        ]
      },
      {
        "title": "Discrete manufacturing",
        "groups": [
          {
            "links": [
              {
                "label": "Aerospace and defense",
                "href": "/industries/aerospace-defense"
              },
              {
                "label": "Automotive",
                "href": "/industries/automotive"
              },
              {
                "label": "High tech",
                "href": "/industries/high-tech"
              },
              {
                "label": "Industrial manufacturing",
                "href": "/industries/industrial-manufacturing"
              }
            ]
          }
        ]
      },
      {
        "title": "Energy and natural resources",
        "groups": [
          {
            "links": [
              {
                "label": "Chemicals",
                "href": "/industries/chemicals"
              },
              {
                "label": "Mill products",
                "href": "/industries/mill-products"
              },
              {
                "label": "Mining",
                "href": "/industries/mining"
              },
              {
                "label": "Oil, gas, and energy",
                "href": "/industries/oil-gas-energy"
              },
              {
                "label": "Utilities",
                "href": "/industries/utilities"
              }
            ]
          }
        ]
      },
      {
        "title": "Services industries",
        "groups": [
          {
            "links": [
              {
                "label": "Construction and real estate",
                "href": "/industries/construction-real-estate"
              },
              {
                "label": "Media, sports, and entertainment",
                "href": "/industries/media-sports-entertainment"
              },
              {
                "label": "Professional services",
                "href": "/industries/professional-services"
              },
              {
                "label": "Telecommunications",
                "href": "/industries/telecommunications"
              },
              {
                "label": "Travel and transportation",
                "href": "/industries/travel-transportation"
              }
            ]
          }
        ],
        "row": 1
      },
      {
        "title": "Public services",
        "groups": [
          {
            "links": [
              {
                "label": "Defense and security",
                "href": "/industries/defense-security"
              },
              {
                "label": "Education and research",
                "href": "/industries/education-research"
              },
              {
                "label": "Government",
                "href": "/industries/government"
              },
              {
                "label": "Healthcare",
                "href": "/industries/healthcare"
              }
            ]
          }
        ],
        "row": 1
      },
      {
        "title": "Financial services",
        "groups": [
          {
            "links": [
              {
                "label": "Financial services",
                "href": "/industries/financial-services"
              }
            ]
          }
        ],
        "row": 1
      }
    ]
  },
  {
    "label": "Transform and Support",
    "layout": "dropdown",
    "columns": [
      {
        "title": "How to transform to cloud",
        "groups": [
          {
            "links": [
              {
                "label": "RISE with SAP for existing customers",
                "href": "/products/erp/rise"
              },
              {
                "label": "SAP GROW for new customers",
                "href": "/products/erp/grow"
              },
              {
                "label": "Sovereign solutions for highly regulated industries",
                "href": "/products/security-and-sovereignty"
              }
            ]
          }
        ]
      },
      {
        "title": "Services and support offerings",
        "groups": [
          {
            "links": [
              {
                "label": "Foundational Success Plan",
                "href": "/services-support/foundational-success-plan"
              },
              {
                "label": "Advanced Success Plan",
                "href": "/services-support/advanced-success-plan"
              },
              {
                "label": "Max Success Plan",
                "href": "/services-support/max-success-plan"
              },
              {
                "label": "Learning services",
                "href": "/services-support/education-consulting"
              },
              {
                "label": "Implementation services",
                "href": "https://www.sap.com/mena/services-support/featured-solutions.html"
              },
              {
                "label": "Development services",
                "href": "https://www.sap.com/mena/services-support/customer-specific-development-services.html"
              },
              {
                "label": "Cloud application services",
                "href": "https://www.sap.com/mena/services-support/cloud-application-services.html"
              }
            ]
          }
        ],
        "titleHref": "/services-support"
      },
      {
        "title": "Customer support portal",
        "groups": [
          {
            "links": [
              {
                "label": "Get support (SAP for Me login)",
                "href": "https://me.sap.com/getsupport"
              },
              {
                "label": "Knowledge base",
                "href": "https://support.sap.com/en/my-support/knowledge-base.html"
              },
              {
                "label": "Documentation (Help Portal)",
                "href": "https://help.sap.com/"
              },
              {
                "label": "Software downloads",
                "href": "https://support.sap.com/en/my-support/software-downloads.html"
              },
              {
                "label": "Application lifecycle management",
                "href": "https://support.sap.com/en/alm.html"
              },
              {
                "label": "Maintenance information",
                "href": "https://support.sap.com/en/release-upgrade-maintenance/maintenance-information.html"
              },
              {
                "label": "SAP Business Network for Suppliers",
                "href": "/products/business-network/suppliers/support"
              }
            ]
          }
        ],
        "titleHref": "https://support.sap.com/en/index.html"
      }
    ]
  },
  {
    "label": "Learning",
    "layout": "dropdown",
    "columns": [
      {
        "title": "Learning overview",
        "groups": [
          {
            "links": [
              {
                "label": "SAP Learning Hub",
                "href": "/training-certification/learning-hub"
              },
              {
                "label": "SAP Learning Class",
                "href": "https://training.sap.com/content/sap-learning-class-in-person-virtual"
              },
              {
                "label": "SAP Certification",
                "href": "/training-certification/sap-certification"
              }
            ]
          }
        ],
        "titleHref": "/training-certification"
      }
    ]
  },
  {
    "label": "Community",
    "layout": "dropdown",
    "columns": [
      {
        "title": "Community overview",
        "groups": [
          {
            "links": [
              {
                "label": "Products and technology",
                "href": "https://community.sap.com/t5/products-and-technology/ct-p/products"
              },
              {
                "label": "Groups",
                "href": "https://community.sap.com/t5/groups/ct-p/groups"
              },
              {
                "label": "Developers",
                "href": "https://community.sap.com/t5/developers/ct-p/developers"
              },
              {
                "label": "Partners",
                "href": "https://pages.community.sap.com/resources/partners"
              },
              {
                "label": "Events",
                "href": "https://community.sap.com/t5/events/ct-p/events"
              },
              {
                "label": "Help",
                "href": "https://community.sap.com/t5/help/faqpage"
              },
              {
                "label": "Topic pages",
                "href": "https://pages.community.sap.com/topics"
              }
            ]
          }
        ],
        "titleHref": "https://community.sap.com/"
      }
    ]
  },
  {
    "label": "Partners",
    "layout": "dropdown",
    "columns": [
      {
        "title": "Partner overview",
        "groups": [
          {
            "links": [
              {
                "label": "Find partner products and solutions",
                "href": "/partners/find-partner-solutions"
              },
              {
                "label": "Find SAP partners",
                "href": "/partners/find"
              },
              {
                "label": "Become a partner",
                "href": "/partners/partner-program"
              },
              {
                "label": "SAP Partner Awards",
                "href": "https://www.sap.com/mena/partners/partner-awards.html"
              }
            ]
          }
        ],
        "titleHref": "/partners"
      },
      {
        "title": "Partner login",
        "groups": [
          {
            "links": [
              {
                "label": "SAP Partner Portal",
                "href": "https://partneredge.sap.com/en/welcome.html",
                "external": true
              },
              {
                "label": "SAP Store Partner Cockpit",
                "href": "https://partnercockpit.store.sap.com",
                "external": true
              },
              {
                "label": "Solution Hub",
                "href": "https://solutionhub.store.sap.com/solution-hub",
                "external": true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "label": "About",
    "layout": "dropdown",
    "columns": [
      {
        "groups": [
          {
            "links": [
              {
                "label": "Company information",
                "href": "/about/company"
              },
              {
                "label": "Careers",
                "href": "https://jobs.sap.com/"
              },
              {
                "label": "Customer stories",
                "href": "/about/customer-stories"
              },
              {
                "label": "Ethics and compliance",
                "href": "/about/ethics-and-compliance"
              },
              {
                "label": "Events",
                "href": "/events"
              },
              {
                "label": "Investor Relations",
                "href": "https://www.sap.com/investors/en.html"
              },
              {
                "label": "News center",
                "href": "https://news.sap.com/mena/"
              },
              {
                "label": "SAP Trust Center",
                "href": "/about/trust-center"
              }
            ]
          }
        ]
      }
    ]
  }
];

// Utility dropdown opened by "Explore SAP" in the live sap.com/mena masthead.
export const EXPLORE_SAP_MENU: MastheadMenu = {
  label: "Explore SAP",
  layout: "dropdown",
  title: "Explore all areas of SAP",
  columns: [
    {
      title: "Products",
      titleHref: "/products",
      groups: [
        {
          links: [
            { label: "Products", href: "/products" },
            { label: "Autonomous Enterprise", href: "/products/business-suite" },
            { label: "Artificial intelligence", href: "/products/artificial-intelligence" },
            { label: "Data and analytics", href: "/products/data-cloud" },
            { label: "Autonomous Suite", href: "/products/business-applications" },
            { label: "AI platform", href: "/products/ai-platform" },
            {
              label: "Transformation management",
              href: "/products/business-transformation-management",
            },
            { label: "Midsize business solutions", href: "/products/erp/grow" },
            { label: "Financial management", href: "/products/financial-management" },
            { label: "Spend management", href: "/products/spend-management" },
            { label: "Supply chain management", href: "/products/scm" },
            { label: "Human capital management", href: "/products/hcm" },
            { label: "Customer experience", href: "/products/crm" },
            { label: "Enterprise resource planning", href: "/products/erp" },
            { label: "Business network", href: "/products/business-network" },
            { label: "Sustainability management", href: "/products/sustainability" },
            {
              label: "SAP Store",
              href: "https://www.sap.com/mena/store.html",
              external: true,
            },
            {
              label: "Try SAP",
              href: "/products/try-sap",
              external: true,
            },
            { label: "View all industries", href: "/industries" },
            { label: "Partners", href: "/partners" },
            { label: "Services", href: "/services-support" },
          ],
        },
      ],
    },
    {
      title: "Learning and support",
      groups: [
        {
          links: [
            {
              label: "Learning and certification",
              href: "https://learning.sap.com",
              external: true,
            },
            { label: "Support", href: "https://support.sap.com", external: true },
            { label: "Documentation", href: "https://help.sap.com", external: true },
            {
              label: "Community",
              href: "https://community.sap.com/",
              external: true,
            },
          ],
        },
      ],
    },
    {
      title: "About",
      groups: [
        {
          links: [
            { label: "Company information", href: "/about/company" },
            {
              label: "Careers",
              href: "https://jobs.sap.com/?utm_source=CareerSite&utm_campaign=CorpSite_HD",
              external: true,
            },
            { label: "Customer stories", href: "/about/customer-stories" },
            { label: "Ethics and compliance", href: "/about/ethics-and-compliance" },
            { label: "Events", href: "/events" },
            {
              label: "Investor Relations",
              href: "https://www.sap.com/investors/en.html",
              external: true,
            },
            { label: "News center", href: "https://news.sap.com/mena/", external: true },
            { label: "SAP Trust Center", href: "/about/trust-center" },
          ],
        },
      ],
    },
  ],
};
