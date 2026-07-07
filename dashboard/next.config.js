/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Saída standalone para deploy em container (Docker/Coolify)
  output: "standalone",
};

module.exports = nextConfig;
