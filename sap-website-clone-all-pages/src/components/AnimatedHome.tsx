"use client";

import { useEffect, useRef, type ReactNode } from "react";

const ACTIVE_TAB = "Tabs__active--ECNLz";
const ACTIVE_VERTICAL = "VerticalTabs__active--quRB8";

export default function AnimatedHome({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    // Restore the official SAP tab animations. The captured markup already
    // contains every panel and the CSS transitions; only the class toggling
    // done by SAP's JavaScript is missing in this static local clone.
    root.querySelectorAll<HTMLElement>(".Tabs__tabs--rRraH").forEach((group) => {
      const containers = Array.from(
        group.querySelectorAll<HTMLElement>(".Tabs__tabContainer--G48TE")
      );
      if (containers.length < 2) return;

      const verticalRoot = group.closest<HTMLElement>(
        '[data-component-name="VerticalTabs"]'
      );
      const sideWrappers = verticalRoot
        ? Array.from(
            verticalRoot.querySelectorAll<HTMLElement>(
              ".VerticalTabs__contentWrapper--zYd1a"
            )
          )
        : [];

      containers.forEach((container, index) => {
        const button = container.querySelector<HTMLButtonElement>(
          ".Tabs__tabButton--LoQ0y"
        );
        if (!button) return;

        const activate = () => {
          containers.forEach((item, itemIndex) => {
            const active = itemIndex === index;

            item
              .querySelectorAll<HTMLElement>(
                ".Tabs__tabWrapper--rwkuF, .Tabs__tabButton--LoQ0y, .Tabs__animationWrapper--WHwdS, .Tabs__tabContent--kBDJk"
              )
              .forEach((element) => element.classList.toggle(ACTIVE_TAB, active));

            const itemButton = item.querySelector<HTMLButtonElement>(
              ".Tabs__tabButton--LoQ0y"
            );
            itemButton?.setAttribute("aria-expanded", String(active));

            item
              .querySelectorAll<HTMLElement>(".Tabs__animationWrapper--WHwdS")
              .forEach((element) =>
                element.setAttribute("aria-hidden", String(!active))
              );

            item.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
              link.tabIndex = active ? 0 : -1;
            });
          });

          sideWrappers.forEach((wrapper, wrapperIndex) => {
            wrapper.classList.toggle(
              ACTIVE_VERTICAL,
              wrapperIndex === index
            );
          });
        };

        button.addEventListener("click", activate);
        cleanups.push(() => button.removeEventListener("click", activate));
      });
    });

    // Joule video: muted, looping autoplay with SAP's inline play/pause
    // button underneath (live sap.com behaviour).
    const video = root.querySelector<HTMLVideoElement>("video");
    const toggle = root.querySelector<HTMLButtonElement>(".home-video-toggle");
    if (video) {
      const syncToggle = () => {
        if (!toggle) return;
        const label = video.paused ? "Play" : "Pause";
        toggle.setAttribute("aria-label", label);
        toggle.title = label;
        toggle.dataset.state = video.paused ? "paused" : "playing";
      };
      const startVideo = () => {
        video.muted = true;
        video.loop = true;
        void video.play().catch(() => undefined);
      };
      const onToggle = () => {
        if (video.paused) startVideo();
        else video.pause();
      };
      startVideo();
      syncToggle();
      video.addEventListener("canplay", startVideo, { once: true });
      video.addEventListener("play", syncToggle);
      video.addEventListener("pause", syncToggle);
      toggle?.addEventListener("click", onToggle);
      cleanups.push(() => {
        video.removeEventListener("canplay", startVideo);
        video.removeEventListener("play", syncToggle);
        video.removeEventListener("pause", syncToggle);
        toggle?.removeEventListener("click", onToggle);
      });
    }

    // Floating "Contact us" flyout: SAP toggles these classes on the opener,
    // portal and panel; closes on outside click or Escape.
    const opener = root.querySelector<HTMLButtonElement>(".Flyout__opener--i_uwb");
    const portal = root.querySelector<HTMLElement>(".home-contact-flyout");
    const panel = portal?.querySelector<HTMLElement>(".Flyout__content--opPgp");
    if (opener && portal && panel) {
      const setOpen = (open: boolean) => {
        opener.classList.toggle("Flyout__active--SqrgJ", open);
        opener.setAttribute("aria-expanded", String(open));
        portal.classList.toggle("Flyout__portalActive--_jAym", open);
        panel.classList.toggle("Flyout__contentActive--WWJWo", open);
      };
      const onOpenerClick = (event: MouseEvent) => {
        event.stopPropagation();
        setOpen(opener.getAttribute("aria-expanded") !== "true");
      };
      const onDocumentClick = (event: MouseEvent) => {
        if (!panel.contains(event.target as Node)) setOpen(false);
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") setOpen(false);
      };
      opener.addEventListener("click", onOpenerClick);
      document.addEventListener("click", onDocumentClick);
      document.addEventListener("keydown", onKeyDown);
      cleanups.push(() => {
        opener.removeEventListener("click", onOpenerClick);
        document.removeEventListener("click", onDocumentClick);
        document.removeEventListener("keydown", onKeyDown);
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return <div ref={rootRef} className="captured-page home-page">{children}</div>;
}
