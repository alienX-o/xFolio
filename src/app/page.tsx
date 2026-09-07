import { SiteConfigProvider } from "@/components/ConfigProvider";
import { Cursor } from "@/components/chrome/Cursor";
import { Footer } from "@/components/chrome/Footer";
import { Nav } from "@/components/chrome/Nav";
import { BackToTop, ScrollProgress } from "@/components/chrome/Progress";
import { Sections } from "@/components/sections/Sections";
import { siteConfig } from "@/lib/site-config";

/**
 * The portfolio.
 *
 * A server component that does nothing but hand the committed config to the
 * provider — every section reads it from context, so the very same tree can be
 * rendered by the admin preview against an unsaved draft.
 */
export default function Home() {
  return (
    <SiteConfigProvider config={siteConfig}>
      <ScrollProgress />
      <Cursor />
      <Nav />
      <main id="main">
        <Sections />
      </main>
      <Footer />
      <BackToTop />
    </SiteConfigProvider>
  );
}
