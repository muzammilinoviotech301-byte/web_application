import type { Metadata } from "next";

export type AccountCard = {
  title: string;
  description: string;
  href: string;
  action?: string;
  badge?: string;
};

export type AccountChoice = {
  label: string;
  options: string[];
  defaultValue?: string;
};

export type AccountFormVariant =
  | "interests"
  | "personal"
  | "company"
  | "contact"
  | "password"
  | "mfa"
  | "certificates"
  | "sessions"
  | "tokens"
  | "data"
  | "social";

export type AccountSection = {
  title: string;
  description?: string;
  cards?: AccountCard[];
  rows?: { label: string; value: string }[];
  table?: { headers: string[]; rows: string[][] };
  messages?: { subject: string; from: string; date: string; unread?: boolean }[];
  preferences?: { label: string; description: string; defaultOn?: boolean }[];
  choices?: AccountChoice[];
};

export type AccountPageConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: AccountSection[];
  product?: { label: string; placeholder: string; help: string };
  form?: AccountFormVariant;
};

export const ACCOUNT_PAGES = {
  dashboard: {
    eyebrow: "SAP.com Dashboard",
    title: "Welcome to your dashboard",
    subtitle:
      "Access your demos, trials, events, newsletters, courses, and tutorials all in one place. The content below is based on your selected interests. Want to make changes?",
    sections: [
      {
        title: "Selected interests",
        description: "The content below is based on your selected interests.",
        cards: [
          {
            title: "Product",
            description: "SAP S/4HANA Cloud",
            href: "/dashboard/interests",
            action: "Select your interests",
          },
        ],
      },
      {
        title: "Your dashboard",
        cards: [
          {
            title: "What's new?",
            description: "99+ since the last login",
            href: "/dashboard/what-is-new",
            action: "View all new content",
            badge: "99+",
          },
          {
            title: "Demos",
            description: "Recommended demos",
            href: "/dashboard/demos",
            action: "View all demos",
            badge: "90",
          },
          {
            title: "Free trials",
            description: "0 active · 0 recommended",
            href: "/dashboard/trials",
            action: "View all trials",
            badge: "0",
          },
          {
            title: "Active learnings",
            description: "21 courses · 29 developer tutorials",
            href: "/dashboard/learnings",
            action: "View all learnings",
            badge: "21",
          },
          {
            title: "Events",
            description: "Recommended events",
            href: "/dashboard/events",
            action: "View all events",
            badge: "0",
          },
          {
            title: "Newsletters",
            description: "0 selected",
            href: "/dashboard/newsletters",
            action: "View all newsletters",
            badge: "0",
          },
        ],
      },
      {
        title: "Your library",
        cards: [
          {
            title: "Recently viewed",
            description: "Pick up where you left off.",
            href: "/dashboard/recently-viewed",
            action: "View all",
          },
          {
            title: "Saved items",
            description: "All saved content",
            href: "/dashboard/saved-items",
            action: "All saved content",
            badge: "0",
          },
          {
            title: "Content recommendations",
            description: "Explore popular content related to your interests.",
            href: "/dashboard/recommendations",
            action: "View all",
          },
          {
            title: "Marketing preferences",
            description: "Manage your marketing preferences.",
            href: "/dashboard/marketing-preferences",
            action: "View all marketing preferences",
            badge: "0",
          },
        ],
      },
    ],
  },

  account: {
    eyebrow: "My account",
    title: "Account and activity",
    subtitle: "Your SAP Universal ID details and recent activity.",
    sections: [
      {
        title: "Profile details",
        rows: [
          { label: "Name", value: "{name}" },
          { label: "E-mail", value: "{email}" },
          { label: "Country/Region", value: "{country}" },
          { label: "Company", value: "{company}" },
          { label: "Department", value: "{department}" },
          { label: "Relationship to SAP", value: "{relationship}" },
          { label: "Phone", value: "{phone}" },
        ],
      },
      {
        title: "Manage your SAP ID",
        description: "Update your profile, password, authentication methods and sessions.",
        cards: [
          {
            title: "Profile Management",
            description: "SAP Universal ID profile, security and sessions.",
            href: "/account/manage",
            action: "Open",
          },
        ],
      },
      {
        title: "Recent activity",
        table: {
          headers: ["Activity", "Application", "When"],
          rows: [
            ["Signed in", "SAP.com", "Today"],
            ["Viewed learning recommendation", "SAP Learning", "Yesterday"],
            ["Started trial", "SAP BTP", "3 days ago"],
            ["Updated e-mail preferences", "SAP.com", "1 week ago"],
          ],
        },
      },
    ],
  },

  "email-preferences": {
    eyebrow: "My account",
    title: "Manage my E-mail preferences",
    subtitle: "Choose the SAP communications you want to receive.",
    sections: [
      {
        title: "News and updates",
        description: "Your choices are saved for this demo session.",
        preferences: [
          {
            label: "SAP product news",
            description: "Announcements, releases and product updates.",
            defaultOn: true,
          },
          {
            label: "Events and webinars",
            description: "Invitations to SAP events near you.",
            defaultOn: true,
          },
          {
            label: "Learning recommendations",
            description: "Courses and learning journeys picked for you.",
          },
          {
            label: "Trials and demos",
            description: "New trials, demos and premium content.",
            defaultOn: true,
          },
          {
            label: "Customer stories",
            description: "How other customers use SAP solutions.",
          },
        ],
      },
    ],
  },

  trials: {
    eyebrow: "Get started",
    title: "trials",
    subtitle: "Try SAP software for yourself, at no cost and with no commitment.",
    sections: [
      {
        title: "Popular trials",
        cards: [
          {
            title: "SAP S/4HANA Cloud",
            description: "Run a live enterprise resource planning system.",
            href: "/product-login/ariba",
            action: "Start trial",
          },
          {
            title: "SAP Business Technology Platform",
            description: "Build, integrate and extend with a trial account.",
            href: "/product-login/fieldglass",
            action: "Start trial",
          },
          {
            title: "SAP Analytics Cloud",
            description: "Explore planning and analytics in one solution.",
            href: "/product-login/successfactors",
            action: "Start trial",
          },
          {
            title: "SAP SuccessFactors",
            description: "Experience cloud HR and talent management.",
            href: "/product-login/successfactors",
            action: "Start trial",
          },
        ],
      },
    ],
  },

  learning: {
    eyebrow: "Get started",
    title: "Learning",
    subtitle: "Grow your SAP skills with free learning for every role.",
    sections: [
      {
        title: "Recommended for you",
        cards: [
          {
            title: "SAP Learning Journey",
            description: "A guided path from basics to certification.",
            href: "/learning",
            action: "Continue",
          },
          {
            title: "SAP Discovery Center missions",
            description: "Hands-on scenarios using trial environments.",
            href: "/trials",
            action: "Explore",
          },
          {
            title: "SAP Help Portal",
            description: "Product documentation and implementation guides.",
            href: "/account",
            action: "Open",
          },
          {
            title: "SAP TechEd sessions",
            description: "Discover the latest from SAP experts.",
            href: "/inbox",
            action: "Browse",
          },
        ],
      },
    ],
  },

  orders: {
    eyebrow: "My account",
    title: "Orders",
    subtitle: "Review your SAP Store orders and subscriptions.",
    sections: [
      {
        title: "Recent orders",
        table: {
          headers: ["Order", "Date", "Product", "Status", "Total"],
          rows: [
            ["SAP-104892", "12 Nov 2026", "SAP Analytics Cloud", "Completed", "$1,200"],
            ["SAP-104301", "28 Oct 2026", "SAP BTP trial credits", "Completed", "$0"],
            ["SAP-103776", "04 Oct 2026", "SAP Learning subscription", "Completed", "$450"],
          ],
        },
      },
    ],
  },

  "shopping-cart": {
    eyebrow: "My account",
    title: "Shopping cart",
    subtitle: "Items you have saved in your SAP Store cart.",
    sections: [
      {
        title: "Your items",
        table: {
          headers: ["Item", "Type", "Price"],
          rows: [
            ["SAP SuccessFactors Employee Central", "Subscription", "$980"],
            ["SAP Fiori design pack", "Download", "$120"],
          ],
        },
      },
    ],
  },

  inbox: {
    eyebrow: "My account",
    title: "Inbox",
    subtitle: "Messages and notifications from SAP.",
    sections: [
      {
        title: "8 messages",
        messages: [
          {
            subject: "Your SAP ID is ready",
            from: "SAP Universal ID",
            date: "Today",
            unread: true,
          },
          {
            subject: "Welcome to SAP MENA",
            from: "SAP",
            date: "Today",
            unread: true,
          },
          {
            subject: "New learning recommendations",
            from: "SAP Learning",
            date: "Yesterday",
            unread: true,
          },
          {
            subject: "Your trial is available",
            from: "SAP Business Technology Platform",
            date: "Yesterday",
            unread: true,
          },
          {
            subject: "SAP NOW AI Tour Riyadh",
            from: "SAP Events",
            date: "3 days ago",
            unread: true,
          },
          {
            subject: "Order confirmation",
            from: "SAP Store",
            date: "1 week ago",
            unread: true,
          },
          {
            subject: "E-mail preferences updated",
            from: "SAP.com",
            date: "1 week ago",
            unread: true,
          },
          {
            subject: "Your weekly SAP digest",
            from: "SAP",
            date: "2 weeks ago",
            unread: true,
          },
        ],
      },
    ],
  },

  "what-is-new": {
    eyebrow: "SAP.com Dashboard",
    title: "What's New?",
    subtitle:
      "The content below is based on your selected interests. Want to make changes?",
    sections: [
      {
        title: "Selected interests",
        cards: [
          {
            title: "Content types",
            description:
              "Customer Stories · Events · Partner · Product Information · SAP Corporate",
            href: "/dashboard/interests",
            action: "View all",
            badge: "+2",
          },
        ],
      },
      {
        title: "3212 results",
        cards: [
          {
            title: "Jinhong Fashion: Building Standardized End-to-End Digital Processes",
            description: "Customer Stories · November 25, 2026",
            href: "/dashboard/what-is-new",
            action: "Read",
          },
          {
            title: "ABeam Consulting – Sales and Manufacturing Platform for SAP GROW",
            description: "Product Information · November 25, 2026",
            href: "/dashboard/what-is-new",
            action: "Read",
          },
          {
            title: "How did multiple global systems move to the cloud unnoticed?",
            description: "Customer Stories · November 25, 2026",
            href: "/dashboard/what-is-new",
            action: "Read",
          },
          {
            title: "Sanwa Needle Bearing Co., Ltd.: Renewing Core Systems on SAP Cloud ERP",
            description: "Customer Stories · November 24, 2026",
            href: "/dashboard/what-is-new",
            action: "Read",
          },
        ],
      },
    ],
  },

  "marketing-preferences": {
    eyebrow: "SAP.com Dashboard",
    title: "Marketing communication preferences",
    subtitle:
      "Select and manage the marketing communications and newsletter subscriptions you receive from SAP.",
    sections: [
      {
        title: "Manage your marketing preferences",
        description:
          "Please select the type of updates you would like to receive. To make changes, adjust the options below and submit your preferences.",
        choices: [
          {
            label: "ERP and Financial Management",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "Interested",
          },
          {
            label: "CRM and Customer Experience",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "No preference",
          },
          {
            label: "Spend Management",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "No preference",
          },
          {
            label: "Supply Chain Management",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "Interested",
          },
          {
            label: "Human Capital Management",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "No preference",
          },
          {
            label: "Business Technology Platform",
            options: ["Interested", "Not interested", "No preference"],
            defaultValue: "Interested",
          },
        ],
      },
      {
        title: "Additional Marketing Communication Preferences",
        rows: [
          { label: "Company", value: "{company}" },
          { label: "Industry", value: "Information Technology" },
          { label: "Department", value: "{department}" },
          { label: "Relationship to SAP", value: "{relationship}" },
          { label: "Function", value: "Consulting" },
          { label: "Language", value: "English" },
        ],
      },
    ],
  },

  "dashboard-learnings": {
    eyebrow: "SAP.com Dashboard",
    title: "Learnings",
    subtitle:
      "The content below is based on your selected interests. Want to make changes?",
    sections: [
      {
        title: "Selected interests",
        cards: [
          {
            title: "Product",
            description: "SAP S/4HANA Cloud",
            href: "/dashboard/interests",
            action: "Select your interests",
          },
        ],
      },
      {
        title: "Active learnings",
        cards: [
          {
            title: "Course",
            description: "21 courses assigned to your learning plan.",
            href: "/learning",
            action: "View all learnings",
            badge: "21",
          },
          {
            title: "Developer Tutorial",
            description: "29 developer tutorials based on your interests.",
            href: "/learning",
            action: "View all tutorials",
            badge: "29",
          },
        ],
      },
    ],
  },

  "dashboard-trials": {
    eyebrow: "SAP.com Dashboard",
    title: "Free Trials",
    subtitle:
      "The content below is based on your selected interests. Want to make changes?",
    sections: [
      {
        title: "Your Trials",
        cards: [
          {
            title: "Active trials",
            description: "0 active",
            href: "/trials",
            action: "View all trials",
            badge: "0",
          },
          {
            title: "Recommended trials",
            description: "0 recommended",
            href: "/trials",
            action: "Explore trials",
            badge: "0",
          },
        ],
      },
    ],
  },

  events: {
    eyebrow: "SAP.com Dashboard",
    title: "Events",
    subtitle: "Select virtual or in-person events in your language or country",
    sections: [
      {
        title: "Recommended events",
        description: "0 results",
        cards: [
          {
            title: "SAP NOW AI Tour Riyadh",
            description: "December 2, 2026 · SARAJ, Riyadh",
            href: "/dashboard/events",
            action: "Register now",
          },
        ],
      },
    ],
  },

  demos: {
    eyebrow: "SAP.com Dashboard",
    title: "Demos",
    subtitle:
      "The content below is based on your selected interests. Want to make changes?",
    sections: [
      {
        title: "Recommended demos",
        description: "90 results",
        cards: [
          {
            title: "Advanced Intercompany Sales in SAP Cloud ERP",
            description: "Expert Talk · 1 of 20",
            href: "/dashboard/demos",
            action: "Watch demo",
          },
          {
            title: "AI for Engineering, Construction and Operations (EC&O)",
            description: "Demo · SAP Business AI",
            href: "/dashboard/demos",
            action: "Watch demo",
          },
          {
            title: "RISE with SAP",
            description: "Demo · Cloud ERP",
            href: "/dashboard/demos",
            action: "Watch demo",
          },
        ],
      },
    ],
  },

  newsletters: {
    eyebrow: "SAP.com Dashboard",
    title: "Newsletters",
    subtitle:
      "Subscribe for updates on SAP strategy, news, and events for SAP customers, prospects, and partners.",
    sections: [
      {
        title: "Newsletter categories",
        preferences: [
          {
            label: "General newsletters",
            description: "SAP strategy, company news and executive updates.",
            defaultOn: true,
          },
          {
            label: "Product newsletters",
            description: "Updates about the SAP products you follow.",
            defaultOn: true,
          },
          {
            label: "Learning newsletters",
            description: "Courses, missions and certification updates.",
          },
          {
            label: "Services and support newsletters",
            description: "Support news, best practices and service updates.",
          },
          {
            label: "Industries newsletters",
            description: "News and insights for your industry.",
          },
          {
            label: "My newsletters",
            description: "Newsletters you have already subscribed to.",
            defaultOn: true,
          },
        ],
      },
    ],
  },

  "recently-viewed": {
    eyebrow: "SAP.com Dashboard",
    title: "Recently Viewed",
    subtitle: "Pick up where you left off by accessing recently viewed content.",
    sections: [
      {
        title: "Recently viewed content",
        description:
          "To access your recently viewed content, functional cookies need to be accepted.",
        cards: [
          {
            title: "Update cookie consent",
            description: "Enable functional cookies to see the pages you visited.",
            href: "/account/email-preferences",
            action: "Update cookie consent",
          },
        ],
      },
    ],
  },

  "saved-items": {
    eyebrow: "SAP.com Dashboard",
    title: "Saved Items",
    subtitle:
      "Access all your saved content in one place to quickly find information on your selected interests.",
    sections: [
      {
        title: "Saved content",
        description: "We're sorry, but your search didn't return any results.",
        cards: [
          {
            title: "Browse new content",
            description: "Find content to save for later.",
            href: "/dashboard/what-is-new",
            action: "Browse",
          },
        ],
      },
    ],
  },

  recommendations: {
    eyebrow: "SAP.com Dashboard",
    title: "Content Recommendations",
    subtitle: "Explore popular content related to your interests.",
    sections: [
      {
        title: "Other content",
        description:
          "To access your recommended content, functional cookies need to be accepted.",
        cards: [
          {
            title: "Update cookie consent",
            description: "Enable functional cookies to personalize recommendations.",
            href: "/dashboard/interests",
            action: "Update cookie consent",
          },
        ],
      },
    ],
  },

  interests: {
    eyebrow: "SAP.com Dashboard",
    title: "What are your interests?",
    subtitle: "Select from the portfolio categories, subcategories or products",
    sections: [],
    form: "interests",
  },

  "manage-account": {
    eyebrow: "Profile Management",
    title: "Profile Management",
    subtitle:
      "Manage your SAP Universal ID profile, authentication methods, social sign-on and sessions.",
    sections: [
      {
        title: "Profile",
        cards: [
          {
            title: "Personal Information",
            description: "Name, e-mail, login name, phone, language and time zone.",
            href: "/account/personal-information",
            action: "Edit",
          },
          {
            title: "Company Information",
            description: "Company country/region and city.",
            href: "/account/company-information",
            action: "Edit",
          },
          {
            title: "Contact Preferences",
            description: "Choose how SAP may contact you.",
            href: "/account/contact-preferences",
            action: "Edit",
          },
          {
            title: "My Data",
            description: "View or download your SAP Universal ID data.",
            href: "/account/my-data",
            action: "View",
          },
        ],
      },
      {
        title: "Authentication",
        cards: [
          {
            title: "Password",
            description: "Change the password for your SAP ID.",
            href: "/account/password",
            action: "Change",
          },
          {
            title: "Multi-Factor Authentication",
            description: "Two-factor, TOTP two-factor and Web two-factor authentication.",
            href: "/account/multi-factor-authentication",
            action: "Manage",
          },
          {
            title: "Certificates",
            description: "Generate a certificate for passwordless sign-on.",
            href: "/account/certificates",
            action: "Generate",
          },
          {
            title: "Social Sign-On",
            description: "Link your account with a social sign-on provider.",
            href: "/account/social-sign-on",
            action: "View",
          },
        ],
      },
      {
        title: "Sessions and Tokens",
        cards: [
          {
            title: "Active Sessions",
            description: "See and control your active sign-in sessions.",
            href: "/account/sessions",
            action: "View",
          },
          {
            title: "Application Access Tokens",
            description: "Review and delete tokens issued to applications.",
            href: "/account/access-tokens",
            action: "View",
          },
        ],
      },
    ],
  },

  "personal-information": {
    eyebrow: "Profile Management",
    title: "Personal Information",
    subtitle: "Your SAP Universal ID personal details.",
    sections: [
      {
        title: "Personal Information",
        rows: [
          { label: "First Name", value: "{firstName}" },
          { label: "Last Name", value: "{lastName}" },
          { label: "Email", value: "{email}" },
          { label: "Login Name", value: "--" },
          { label: "Display Name", value: "{email}" },
          { label: "User ID", value: "P2013485534" },
          { label: "Phone", value: "{phone}" },
          { label: "Language", value: "--" },
          { label: "Time Zone", value: "--" },
        ],
      },
    ],
    form: "personal",
  },

  "company-information": {
    eyebrow: "Profile Management",
    title: "Company Information",
    subtitle: "The organization details associated with your SAP ID.",
    sections: [
      {
        title: "Company Information",
        rows: [
          { label: "Company Country/Region", value: "{country}" },
          { label: "Company City", value: "--" },
        ],
      },
    ],
    form: "company",
  },

  "contact-preferences": {
    eyebrow: "Profile Management",
    title: "Contact Preferences",
    subtitle: "Choose how SAP may contact you about your account.",
    sections: [
      {
        title: "Contact Preferences",
        rows: [
          { label: "By email", value: "--" },
          { label: "By telephone", value: "--" },
        ],
      },
    ],
    form: "contact",
  },

  password: {
    eyebrow: "Profile Management",
    title: "Password",
    subtitle:
      "Your password grants you access to any platform connected to Identity Authentication.",
    sections: [],
    form: "password",
  },

  "multi-factor-authentication": {
    eyebrow: "Profile Management",
    title: "Multi-Factor Authentication",
    subtitle: "Add a second factor when authenticating with your SAP ID.",
    sections: [
      {
        title: "Authentication methods",
        rows: [
          {
            label: "Two-Factor Authentication",
            value: "Enable — always provide a second factor when authenticating.",
          },
          {
            label: "TOTP Two-Factor Authentication",
            value: "Activate — no devices are currently activated.",
          },
          {
            label: "Web Two-Factor Authentication",
            value: "Add Device — no devices are currently activated.",
          },
        ],
      },
    ],
    form: "mfa",
  },

  certificates: {
    eyebrow: "Profile Management",
    title: "Certificates",
    subtitle: "Generate a certificate for passwordless sign-on with your SAP ID.",
    sections: [],
    form: "certificates",
  },

  sessions: {
    eyebrow: "Profile Management",
    title: "Active Sessions",
    subtitle: "You are able to see and control your active sessions.",
    sections: [],
    form: "sessions",
  },

  "access-tokens": {
    eyebrow: "Profile Management",
    title: "Application Access Tokens",
    subtitle: "You are able to see and control application access tokens.",
    sections: [],
    form: "tokens",
  },

  "my-data": {
    eyebrow: "Profile Management",
    title: "Your Profile Information",
    subtitle: "View or download the data stored with your SAP Universal ID.",
    sections: [],
    form: "data",
  },

  "social-sign-on": {
    eyebrow: "Profile Management",
    title: "Social Sign-On",
    subtitle: "Link your account with a social sign-on provider.",
    sections: [
      {
        title: "Social Sign-On",
        description:
          "Your account does not currently use social sign-on. To link your account with a social sign-on provider, click one of the social network buttons next time you log on.",
      },
    ],
    form: "social",
  },

  ariba: {
    eyebrow: "Product login",
    title: "SAP Ariba",
    subtitle: "Sign in to your SAP Ariba procurement account.",
    sections: [],
    product: {
      label: "Company ID",
      placeholder: "Enter your company ID",
      help: "Use the Company ID from your SAP Ariba invitation e-mail.",
    },
  },

  concur: {
    eyebrow: "Product login",
    title: "SAP concur",
    subtitle: "Sign in to manage your travel and expenses.",
    sections: [],
    product: {
      label: "Company ID",
      placeholder: "Enter your company ID",
      help: "Your company ID is usually the same as your work e-mail domain.",
    },
  },

  fieldglass: {
    eyebrow: "Product login",
    title: "SAP Fieldglass",
    subtitle: "Sign in to your contingent workforce account.",
    sections: [],
    product: {
      label: "Company ID",
      placeholder: "Enter your company ID",
      help: "Enter the Company ID provided by your SAP Fieldglass administrator.",
    },
  },

  successfactors: {
    eyebrow: "Product login",
    title: "SAP SuccessFactors",
    subtitle: "Sign in to your human experience management account.",
    sections: [],
    product: {
      label: "Company ID",
      placeholder: "Enter your company ID",
      help: "Use the Company ID from your SAP SuccessFactors welcome e-mail.",
    },
  },
} satisfies Record<string, AccountPageConfig>;

export type AccountPageKey = keyof typeof ACCOUNT_PAGES;

export function getAccountPage(key: AccountPageKey): AccountPageConfig {
  return ACCOUNT_PAGES[key] as AccountPageConfig;
}

export function accountMetadata(key: AccountPageKey): Metadata {
  const page = getAccountPage(key);
  return {
    title: `${page.title.replace("{name}", "My account")} | SAP`,
    description: page.subtitle,
  };
}
