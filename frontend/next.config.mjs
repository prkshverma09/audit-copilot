/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@fortune-sheet/react', '@fortune-sheet/core'],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
