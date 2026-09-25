const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Saída standalone para deploy em container (Docker/Coolify)
  output: "standalone",
  // Monorepo: rastreia dependências a partir da raiz (node_modules elevados).
  // A saída fica em .next/standalone/dashboard/server.js (ver Dockerfile).
  outputFileTracingRoot: path.join(__dirname, ".."),
};

module.exports = nextConfig;
