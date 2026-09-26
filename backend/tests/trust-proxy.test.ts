import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import { trustProxyDeEnv } from "../src/lib/trust-proxy.js";

describe("TRUST_PROXY", () => {
  it("vazio, 0 ou false = sem proxy", () => {
    expect(trustProxyDeEnv(undefined)).toBe(false);
    expect(trustProxyDeEnv("")).toBe(false);
    expect(trustProxyDeEnv("0")).toBe(false);
    expect(trustProxyDeEnv("false")).toBe(false);
  });

  it("aceita atalhos, IPs e redes CIDR", () => {
    expect(trustProxyDeEnv("uniquelocal")).toBe("uniquelocal");
    expect(trustProxyDeEnv(" 10.0.1.0/24 , loopback ")).toBe("10.0.1.0/24,loopback");
    expect(trustProxyDeEnv("fd00::/8")).toBe("fd00::/8");
  });

  it("recusa contagem de saltos e valores inválidos na inicialização", () => {
    expect(() => trustProxyDeEnv("1")).toThrow(/contagem de saltos/);
    expect(() => trustProxyDeEnv("10.0.0.0/40")).toThrow(/não é IP/);
    expect(() => trustProxyDeEnv("traefik")).toThrow(/não é IP/);
  });

  it("no Fastify: usa o X-Forwarded-For só quando a conexão vem do proxy confiável", async () => {
    const ipVisto = async (trust: string) => {
      const app = Fastify({ trustProxy: trustProxyDeEnv(trust) });
      app.get("/ip", async (req) => ({ ip: req.ip }));
      // inject() conecta a partir de 127.0.0.1
      const r = await app.inject({ method: "GET", url: "/ip", headers: { "x-forwarded-for": "203.0.113.7" } });
      await app.close();
      return r.json().ip;
    };
    expect(await ipVisto("loopback")).toBe("203.0.113.7"); // proxy confiável: IP real do cliente
    expect(await ipVisto("10.0.0.0/8")).toBe("127.0.0.1"); // conexão não veio do proxy: cabeçalho ignorado
  });
});
