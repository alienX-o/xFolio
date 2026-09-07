"use client";

import { Mail } from "lucide-react";

import { useConfig } from "@/components/ConfigProvider";
import { Reveal } from "@/components/ui/Reveal";
import { ActionLink } from "@/components/ui/bits";
import { RichText } from "@/lib/text";
import { mailto, tel } from "@/lib/url";

/**
 * Closing call to action.
 *
 * Deliberately no contact form: a form needs somewhere to post, and the whole
 * point of this build is that it runs with no backend. Direct mailto/tel links
 * also convert better than a form nobody trusts.
 */
export function Contact() {
  const { contact, links } = useConfig();

  const primaryHref = contact.ctaHref || mailto(links.email) || "";
  const emailHref = mailto(links.email);
  const phoneHref = tel(links.phone);

  return (
    <div className="mx-auto max-w-2xl text-center">
      {contact.body ? (
        <Reveal>
          <RichText
            value={contact.body}
            className="space-y-3 text-base text-muted sm:text-lg"
          />
        </Reveal>
      ) : null}

      <Reveal delay={120}>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <ActionLink
            href={primaryHref}
            variant="primary"
            icon={<Mail size={16} />}
          >
            {contact.ctaLabel || "Send an email"}
          </ActionLink>
          <ActionLink href={contact.secondaryHref} variant="outline">
            {contact.secondaryLabel || "Learn more"}
          </ActionLink>
        </div>
      </Reveal>

      {emailHref || phoneHref ? (
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col items-center gap-2 font-mono text-sm text-muted">
            {emailHref ? (
              <a
                href={emailHref}
                className="transition-colors hover:text-primary"
              >
                {links.email}
              </a>
            ) : null}
            {phoneHref ? (
              <a
                href={phoneHref}
                className="transition-colors hover:text-primary"
              >
                {links.phone}
              </a>
            ) : null}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
}
