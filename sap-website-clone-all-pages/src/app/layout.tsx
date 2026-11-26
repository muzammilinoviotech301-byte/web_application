import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import SiteShell from "@/components/SiteShell";
// SAP loads this component CSS in a late JS chunk on the live site.
import "../../public/captured/styles/2d8b0e7ff5c84878.css";
import "./globals.css";
import "./auth.css";
import "./account-live.css";

export const metadata: Metadata = {
  title: "SAP Software Solutions | Business Applications and Technology",
  description:
    "Explore market-leading software and technology from SAP. Become an intelligent, sustainable enterprise with cloud, platform, and sustainability solutions.",
  icons: {
    icon: "/assets/sap-logo-shape.svg",
    shortcut: "/assets/sap-logo-shape.svg",
    apple: "/assets/sap-logo-shape.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <LocaleProvider>
          <AuthProvider>
            <SiteShell>{children}</SiteShell>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
