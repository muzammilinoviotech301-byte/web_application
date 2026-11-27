"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type ScrollTimelineConstructor = new (options: {
  source: Element;
  axis: "x" | "y";
}) => AnimationTimeline;

type VideoJsPlayer = {
  addClass: (className: string) => void;
  dispose: () => void;
  play: () => Promise<unknown> | void;
};

type VideoJsFactory = (
  element: HTMLVideoElement,
  options: Record<string, unknown>
) => VideoJsPlayer;

const SPEND_VIDEO_SOURCE = "https://d.dam.sap.com/x/SDXYjAr/hls.m3u8?doi=SAP1307510";
const SPEND_VIDEO_ID = "94e76354-4c7f-0010-bca6-c68f7e60039b";
const SPEND_VIDEO_OPTIONS = JSON.stringify({
  poster: "",
  disablePictureInPicture: true,
  html5: {
    vhs: {
      limitRenditionByPlayerDimensions: false,
      enableLowInitialPlaylist: false,
    },
  },
  crossOrigin: "anonymous",
  userActions: { hotkeys: true },
  controls: true,
});

const animatedBars = new WeakSet<Element>();

const SPEND_VIDEO_TRACKS = [
  ["nl_nl", "Dutch", "https://d.dam.sap.com/o/knivoYL/SAP1333004-nl_nl-Dutch?rc=19"],
  ["en_us", "English", "https://d.dam.sap.com/o/kjYhDeV/SAP1333004-en_us-English?rc=19"],
  ["fr_fr", "French (France)", "https://d.dam.sap.com/o/Cvt4oGJ/SAP1333004-fr_fr-French?rc=19"],
  ["de_de", "German", "https://d.dam.sap.com/o/csTJDtP/SAP1333004-de_de-German?rc=19"],
  ["it_it", "Italian", "https://d.dam.sap.com/o/Mq8S4WM/SAP1333004-it_it-Italian?rc=19"],
  ["ja_jp", "Japanese", "https://d.dam.sap.com/o/iPEc8ku/SAP1333004-ja_jp-Japanese?rc=19"],
  ["ko_kr", "Korean", "https://d.dam.sap.com/o/TuBt3Et/SAP1333004-ko_kr-Korean?rc=19"],
  ["pt_br", "Portuguese - Brazil", "https://d.dam.sap.com/o/owftBDB/SAP1333004-pt_br-Portuguese?rc=19"],
  ["es_co", "Spanish - LATAM", "https://d.dam.sap.com/o/vaqjg1A/SAP1333004-es_co-Spanish?rc=19"],
] as const;

// A captured page has SAP's finished DOM and CSS but none of the JavaScript that
// created them. Re-attach the two runtime behaviours the live spend-management
// page has: scroll-linked overlay scrollbars and the embedded HLS video player.
export default function CapturedRuntimeEnhancer() {
  const pathname = usePathname();
  const animationsRef = useRef<Animation[]>([]);
  const playersRef = useRef<VideoJsPlayer[]>([]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let timer = 0;
    const normalized = pathname.replace(/\/$/, "");
    const isSpendPage =
      normalized === "/products/spend-management" ||
      normalized === "/canada/products/spend-management";

    const attachScrollAnimations = () => {
      const ScrollTimeline = (
        window as unknown as { ScrollTimeline?: ScrollTimelineConstructor }
      ).ScrollTimeline;
      if (!ScrollTimeline || typeof KeyframeEffect === "undefined") return;

      document.querySelectorAll<HTMLElement>(".os-scrollbar").forEach((bar) => {
        if (animatedBars.has(bar)) return;
        const host =
          bar.parentElement?.closest<HTMLElement>('[data-overlayscrollbars="host"]') ??
          bar.parentElement;
        const source = host?.querySelector<HTMLElement>("[data-overlayscrollbars-viewport]");
        if (!source) return;

        const axis = bar.classList.contains("os-scrollbar-horizontal") ? "x" : "y";
        const effect = new KeyframeEffect(
          bar,
          [{ "--os-scroll-percent": "0" }, { "--os-scroll-percent": "1" }] as Keyframe[],
          { duration: "auto", easing: "linear" }
        );
        const animation = new Animation(
          effect,
          new ScrollTimeline({ source, axis }) as unknown as AnimationTimeline
        );
        animation.play();
        animatedBars.add(bar);
        animationsRef.current.push(animation);
      });
    };

    const openSpendVideo = (anchor: HTMLAnchorElement) => {
      const wrapper = anchor.closest<HTMLElement>(
        ".EmbeddedVideoPlayer__videoWrapper--aQeot"
      );
      if (!wrapper || wrapper.querySelector("udex-media-player")) return;

      const assetId = anchor.dataset.assetId || SPEND_VIDEO_ID;
      const url = new URL(window.location.href);
      url.searchParams.set("video", assetId);
      window.history.replaceState(window.history.state, "", url);

      const root = document.createElement("div");
      root.className = "VideoPlayerCommon__root--TNnT5 VideoContent__roundedCorners--_PGkh";
      const inner = document.createElement("div");
      inner.className = "VideoPlayerCommon__wrapper--kVKXO VideoPlayerCommon__isEmbedded--M2n_A";

      const sizeStyle = document.createElement("style");
      sizeStyle.textContent =
        "udex-media-player{--udex-media-player-height:100%;--udex-media-player-mobile-width:100%;--udex-media-player-mobile-height:100%}" +
        "udex-media-player .udex-media-player__video{height:100%}";

      const host = document.createElement("udex-media-player");
      host.setAttribute("enable-global-dependency", "true");
      host.setAttribute("classname", "");
      host.setAttribute("source", SPEND_VIDEO_SOURCE);
      host.setAttribute("type", "application/x-mpegURL");
      host.setAttribute("aspect-ratio", "16:9");
      host.setAttribute("options", SPEND_VIDEO_OPTIONS);
      host.setAttribute("width", "100%");
      host.setAttribute("height", "0");
      host.setAttribute("title", "");
      host.setAttribute("udex-media-player", "");

      inner.append(sizeStyle, host);
      root.appendChild(inner);
      wrapper.replaceChildren(root);

      const shadow = host.attachShadow({ mode: "open" });
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/captured/styles/live/video-js.min.css";
      const hostStyle = document.createElement("style");
      hostStyle.textContent =
        ":host{display:block;width:100%;height:100%;background:#000}" +
        ".video-js,.udex-media-player__video{width:100%;height:100%}";
      const video = document.createElement("video");
      video.id = "udex-media-player";
      video.className = "video-js vjs-16-9 vjs-fluid";
      video.setAttribute("playsinline", "");
      video.crossOrigin = "anonymous";
      shadow.append(css, hostStyle, video);

      SPEND_VIDEO_TRACKS.forEach(([srclang, label, src], index) => {
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.src = src;
        track.srclang = srclang;
        track.label = label;
        if (index === 1) track.default = true;
        video.appendChild(track);
      });

      void (async () => {
        try {
          const videoModule = await import("video.js");
          if (disposed || !video.isConnected) return;
          const videojs = (videoModule.default ??
            videoModule) as unknown as VideoJsFactory;
          const player = videojs(video, {
            controls: true,
            autoplay: true,
            fluid: true,
            responsive: true,
            preload: "auto",
            crossOrigin: "anonymous",
            sources: [{ src: SPEND_VIDEO_SOURCE, type: "application/x-mpegURL" }],
            html5: {
              vhs: {
                limitRenditionByPlayerDimensions: false,
                enableLowInitialPlaylist: false,
              },
            },
          });
          player.addClass("vjs-big-play-centered");
          playersRef.current.push(player);
          void player.play()?.catch?.(() => undefined);
        } catch {
          // The poster stays in place if the optional player bundle cannot load.
        }
      })();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest<HTMLAnchorElement>("a[data-react-embedded-video]");
      if (!anchor) return;
      event.preventDefault();
      event.stopPropagation();
      openSpendVideo(anchor);
    };

    frame = window.requestAnimationFrame(() => {
      attachScrollAnimations();
      if (!isSpendPage) return;

      document.addEventListener("click", onClick, true);
      const queryId = new URLSearchParams(window.location.search).get("video");
      if (!queryId) return;
      const anchors = [...document.querySelectorAll<HTMLAnchorElement>(
        "a[data-react-embedded-video]"
      )];
      const anchor = anchors.find((item) => item.dataset.assetId === queryId);
      // Let React finish hydrating the captured body before replacing any of it.
      if (anchor) timer = window.setTimeout(() => openSpendVideo(anchor), 500);
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      animationsRef.current.forEach((animation) => animation.cancel());
      animationsRef.current = [];
      playersRef.current.forEach((player) => player.dispose());
      playersRef.current = [];
    };
  }, [pathname]);

  return null;
}
