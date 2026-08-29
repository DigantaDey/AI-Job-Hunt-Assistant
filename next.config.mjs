/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow the sandbox live-preview proxy origin and localhost during dev.
  allowedDevOrigins: ["*.e2b.app", "http://localhost:3000", "http://0.0.0.0:3000"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
