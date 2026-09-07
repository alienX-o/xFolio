"use client";

import { ExternalLink, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DRAFT_MESSAGE, DRAFT_READY } from "@/lib/messages";
import { useAdminStore } from "@/lib/store";

/**
 * Live preview of the draft.
 *
 * This is a real page load of `/?draft=1` in an iframe, not an inline render
 * of the section components. That matters more than it sounds: the site uses
 * fixed positioning for the nav and progress bar, its own `:root` theme
 * variables, and full-viewport units in the hero. Rendered inline, all three
 * would leak into the admin chrome or be measured against the wrong box. In an
 * iframe the preview *is* the site, so what you approve is what ships.
 *
 * Config is pushed over postMessage on every edit, throttled to one frame, and
 * the frame replays the current draft once it announces itself as ready.
 */

const DEVICES = {
  desktop: { label: "Desktop", width: 1280, icon: Monitor },
  tablet: { label: "Tablet", width: 834, icon: Tablet },
  phone: { label: "Phone", width: 414, icon: Smartphone },
} as const;

type DeviceKey = keyof typeof DEVICES;

export function Preview() {
  const config = useAdminStore((s) => s.config);
  const frame = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [ready, setReady] = useState(false);
  const [nonce, setNonce] = useState(0);

  const push = useCallback(() => {
    const target = frame.current?.contentWindow;
    if (!target) return;
    target.postMessage(
      { type: DRAFT_MESSAGE, config },
      window.location.origin,
    );
  }, [config]);

  // The frame tells us when its listener is attached. Until then, sending is
  // pointless — the iframe usually finishes loading after the first edit.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown } | null;
      if (data?.type === DRAFT_READY) setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Coalesce bursts of edits (dragging a slider) into one message per frame.
    const id = requestAnimationFrame(push);
    return () => cancelAnimationFrame(id);
  }, [ready, push]);

  const reload = () => {
    setReady(false);
    setNonce((n) => n + 1);
  };

  const { width } = DEVICES[device];

  return (
    <div className="flex h-full min-h-0 flex-col bg-neutral-950">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-800 px-3 py-2">
        <div className="flex items-center gap-1">
          {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
            const { label, icon: Icon } = DEVICES[key];
            const active = device === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDevice(key)}
                aria-pressed={active}
                title={label}
                className={`rounded p-1.5 transition-colors ${
                  active
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-200"
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
          <span className="ml-2 font-mono text-[10px] text-neutral-600">
            {width}px
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={reload}
            title="Reload preview"
            className="rounded p-1.5 text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <RotateCcw size={13} />
          </button>
          <a
            href="/?draft=1"
            target="_blank"
            rel="noopener noreferrer"
            title="Open preview in a new tab"
            className="rounded p-1.5 text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/*
        The frame renders at the device width and is scaled down to fit, so the
        site sees a genuine viewport of that size — media queries and `svh`
        units behave exactly as they would on the real device, which they would
        not if we simply narrowed the element.
      */}
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <ScaledFrame width={width}>
          <iframe
            key={nonce}
            ref={frame}
            src="/?draft=1"
            title="Portfolio preview"
            className="h-full w-full border-0 bg-white"
            // Same-origin is required: the preview reads the draft from
            // localStorage and talks back over postMessage.
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </ScaledFrame>
      </div>
    </div>
  );
}

/** Scales its child to fit the available width, preserving the given viewport. */
function ScaledFrame({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setBox({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setBox({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  const scale = box.width > 0 ? Math.min(1, box.width / width) : 1;
  // The frame is laid out at full device height, then scaled, so its internal
  // viewport height stays realistic rather than being squashed.
  const height = scale > 0 ? box.height / scale : box.height;

  return (
    <div ref={host} className="h-full w-full overflow-hidden">
      <div
        className="mx-auto origin-top overflow-hidden rounded border border-neutral-800"
        style={{
          width,
          height: height || undefined,
          transform: `scale(${scale})`,
          // Centre the scaled box: origin-top keeps the top edge, and the
          // negative margin removes the gap the scale leaves behind.
          marginBottom: height ? -(height - height * scale) : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
