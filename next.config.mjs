/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Disable all caching so price/stock changes are immediately visible.
  headers: async () => [
    {
      source: "/((?!_next/static|_next/image|favicon).*)",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" },
        { key: "CDN-Cache-Control", value: "no-store, max-age=0" },
        { key: "Vercel-CDN-Cache-Control", value: "no-store, max-age=0" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
      ],
    },
  ],
  // Kill Next.js client-side Router Cache (default 30s) — price/stock changes
  // should appear immediately when navigating back from admin.
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;
