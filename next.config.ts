import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Force all yjs imports to resolve to the ESM bundle.
    // Turbopack can load both yjs.mjs and yjs.cjs as separate module
    // instances which breaks instanceof checks — y-tiptap's XmlFragment
    // and our XmlFragment become different classes, so .doc returns undefined.
    resolveAlias: {
      yjs: "./node_modules/yjs/dist/yjs.mjs",
    },
  },
};

export default nextConfig;
