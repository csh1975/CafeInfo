/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "@prisma/client"],
  },
};

export default nextConfig;
