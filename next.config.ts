import type { NextConfig } from "next";
import nextra from "nextra";
import { remarkMarkmap } from "./lib/remark-markmap.mjs";
import { remarkMermaidFrame } from "./lib/remark-mermaid-frame.mjs";

const withNextra = nextra({
  unstable_shouldAddLocaleToLinks: true,
  mdxOptions: {
    remarkPlugins: [remarkMarkmap, remarkMermaidFrame],
  },
});

const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  i18n: {
    locales: ["vi", "en", "zh"],
    defaultLocale: "vi",
  },
  basePath,
  assetPrefix: basePath || undefined,
};

export default withNextra(nextConfig);
