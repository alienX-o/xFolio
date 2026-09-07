/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Config images are user-supplied URLs; we allow remote hosts only through
  // the plain <img> path (see safeUrl in src/lib/url.ts) and keep next/image
  // limited to local assets, so no remote-host allowlist is needed here.
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
