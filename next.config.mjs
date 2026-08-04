/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Don't bundle the Neon/Postgres driver — it's a server-only package
  // that Vercel installs at runtime. Without this, Next.js tries to
  // resolve it during build and fails with module_not_found.
  serverExternalPackages: ["@neondatabase/serverless"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
