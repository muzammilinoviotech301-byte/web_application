"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// SAP product pages pin their sub-navigation (<ds-secondary-navigation>) to
// the top of the viewport once the page scrolls past it. SAP's script does
// that by adding these two classes; its captured CSS then makes the bar
// position: fixed, while the wrapper (.SecondaryNavigation__root) keeps the
// bar's height so the content below doesn't jump.
const HOST_STICKY = "SecondaryNavigation__sticky--i7_Lu";
const WRAPPER_STICKY = "secondary-nav-wrapper--sticky";

export default function SecondaryNavSticky() {
  const pathname = usePathname();

  useEffect(() => {
    const update = () => {
      document.querySelectorAll<HTMLElement>(".captured-page ds-secondary-navigation").forEach((nav) => {
        const root = nav.parentElement;
        if (!root) return;
        const stuck = root.getBoundingClientRect().top <= 0;
        nav.classList.toggle(HOST_STICKY, stuck);
        nav.querySelector(".secondary-nav-wrapper")?.classList.toggle(WRAPPER_STICKY, stuck);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  return null;
}
