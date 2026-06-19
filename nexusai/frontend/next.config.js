/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the production Dockerfile's standalone stage.
  output: "standalone",

  // Proxy /api/* to the FastAPI backend in development.
  // In production, nginx handles this routing instead.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/health`,
      },
      {
        source: "/media/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/media/:path*`,
      },
    ];
  },

  // Allow Next.js <Image> to serve presigned MinIO URLs.
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },

  // Strict mode catches subtle React bugs during development.
  reactStrictMode: true,

  // Windows developer machines can block Next's child-process build worker
  // with `spawn EPERM`. Build in-process for reliable local/Docker builds.
  experimental: {
    webpackBuildWorker: false,
  },

  webpack(config, { dev }) {
    if (dev) {
      // Windows dev runs can race on `.next/cache/webpack/*.pack.gz`.
      // Memory cache avoids stale filesystem pack files without changing prod builds.
      config.cache = { type: "memory" };
    }

    return config;
  },

  // Strip console.log (but keep errors/warnings) in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

module.exports = nextConfig;
