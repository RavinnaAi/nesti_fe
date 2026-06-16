const r2PublicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_BASE_URL || "";
let r2PublicHostname = "";
try {
  if (r2PublicBaseUrl) {
    r2PublicHostname = new URL(r2PublicBaseUrl).hostname;
  }
} catch {
  r2PublicHostname = "";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production builds
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Dev indicators configuration (updated for Next.js 15)
  devIndicators: {
    position: "bottom-right",
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "logo.clearbit.com",
      },
      {
        protocol: "https",
        hostname: "img.logo.dev",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      ...(r2PublicHostname
        ? [
            {
              protocol: "https",
              hostname: r2PublicHostname,
            },
          ]
        : []),
    ],
    // Optimize images
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NODE_BACKEND_URL: process.env.NEXT_PUBLIC_NODE_BACKEND_URL,
    NEXT_PUBLIC_SOCKET_ORIGIN: process.env.NEXT_PUBLIC_SOCKET_ORIGIN,
    NEXT_PUBLIC_WS_ORIGIN: process.env.NEXT_PUBLIC_WS_ORIGIN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const connectSrc = isDev
      ? "connect-src 'self' http: https: ws: wss:;"
      : "connect-src 'self' https: wss:;";
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; base-uri 'self'; object-src 'self' data: blob:; frame-src https://calendly.com https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; ${connectSrc} form-action 'self'`,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:publicPage(about|mission|blog|faq|privacy|terms|refund-policy)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/landingPage",
        destination: "/",
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      { source: "/icon-512.png", destination: "/logo/logo.png" },
      { source: "/icon-192.png", destination: "/logo/logo.png" },
      { source: "/icon.png", destination: "/logo/logo.png" },
      { source: "/apple-icon.png", destination: "/logo/logo.png" },
      { source: "/favicon.ico", destination: "/logo/logo.png" },
    ];
  },

};

module.exports = nextConfig;
