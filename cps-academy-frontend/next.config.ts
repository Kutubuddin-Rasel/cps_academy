import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cpsacademy-production.up.railway.app',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
