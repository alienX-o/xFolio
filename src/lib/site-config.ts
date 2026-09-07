import rawConfig from "~/data/portfolio.config.json";

import { DEFAULT_CONFIG } from "@/config/defaults";
import { normalizeConfig } from "@/config/normalize";
import type { PortfolioConfig } from "@/config/schema";

/**
 * The committed config, normalised once at module load.
 *
 * This is a static import, so the JSON is bundled at build time: the public
 * site does no I/O and no fetching to render, which keeps it deployable as a
 * fully static export. Editing the file and redeploying is what "publishing"
 * means here.
 */
export const siteConfig: PortfolioConfig = normalizeConfig(
  rawConfig,
  DEFAULT_CONFIG,
);
