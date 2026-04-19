/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Middleware handles the /zh and /en path mapping and locale cookies
};

export default nextConfig;
