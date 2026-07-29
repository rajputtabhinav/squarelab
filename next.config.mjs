/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "*.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Turbopack is the default bundler in Next.js 16 — empty config suppresses
  // the "webpack config detected but no turbopack config" warning.
  turbopack: {},
};

export default nextConfig;
