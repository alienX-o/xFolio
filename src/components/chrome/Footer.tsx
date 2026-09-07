"use client";

import { useConfig } from "@/components/ConfigProvider";
import { Hairline } from "@/components/ui/bits";
import { getSocialIcon } from "@/lib/social";
import { linkProps } from "@/lib/url";

export function Footer() {
  const { footer, identity, links } = useConfig();

  const socials = footer.showSocials
    ? links.socials
        .filter((s) => s.enabled)
        .map((s) => ({ ...s, props: linkProps(s.url) }))
        .filter((s) => s.props !== null)
    : [];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium tracking-tight">
              {identity.name}
            </p>
            {footer.note ? (
              <p className="mt-2 max-w-sm text-xs text-muted">{footer.note}</p>
            ) : null}
          </div>

          {socials.length > 0 ? (
            <ul className="flex flex-wrap items-center justify-center gap-4">
              {socials.map((social) => {
                const Icon = getSocialIcon(social.platform);
                return (
                  <li key={social.id}>
                    <a
                      {...social.props!}
                      aria-label={social.label || social.platform}
                      title={social.label || social.platform}
                      className="block p-1 text-muted transition-colors duration-300 hover:text-fg"
                    >
                      <Icon className="h-[16px] w-[16px]" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <Hairline className="my-8 opacity-60" />

        <div className="flex flex-col items-center gap-2 text-center font-mono text-[11px] text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>
            {/* Baked into the HTML at build time, then corrected on hydration,
                so a long-lived static deploy still shows the current year. */}
            &copy; {new Date().getFullYear()} {identity.name}. All rights
            reserved.
          </p>
          {footer.credit ? <p>{footer.credit}</p> : null}
        </div>
      </div>
    </footer>
  );
}
