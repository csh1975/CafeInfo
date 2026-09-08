/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@libsql/client", "@prisma/client", "@prisma/adapter-libsql"],
  },
};

export default nextConfig;
