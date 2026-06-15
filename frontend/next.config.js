/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize external images from Unsplash and other CDNs
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/webp"],
  },

  // Reduce bundle size by optimizing package imports
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

module.exports = nextConfig;
