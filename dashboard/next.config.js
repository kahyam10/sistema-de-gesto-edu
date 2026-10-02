const path = require("node:path");

// Cabeçalhos fixos para TODAS as respostas (páginas e estáticos). A CSP, que
// precisa de nonce por requisição, é montada em src/proxy.ts.
const cabecalhosDeSeguranca = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Não anuncia o framework no cabeçalho X-Powered-By
  poweredByHeader: false,
  // Saída standalone para deploy em container (Docker/Coolify)
  output: "standalone",
  // Monorepo: rastreia dependências a partir da raiz (node_modules elevados).
  // A saída fica em .next/standalone/dashboard/server.js (ver Dockerfile).
  outputFileTracingRoot: path.join(__dirname, ".."),
  async headers() {
    return [{ source: "/:path*", headers: cabecalhosDeSeguranca }];
  },
};

module.exports = nextConfig;
