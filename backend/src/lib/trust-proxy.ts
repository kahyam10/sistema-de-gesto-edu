import { isIP } from "node:net";

// Palavras-chave aceitas pelo proxy-addr (usado pelo Fastify)
const PREDEFINIDOS = new Set(["loopback", "linklocal", "uniquelocal"]);

/**
 * Converte TRUST_PROXY no valor de `trustProxy` do Fastify.
 *
 * Aceita a lista (separada por vírgula) dos endereços do proxy reverso: IPs,
 * redes CIDR ou os atalhos `loopback`, `linklocal` e `uniquelocal` (redes
 * privadas 10/8, 172.16/12, 192.168/16 e fc00::/7 — onde fica o Traefik do
 * Coolify). Vazio, "0" ou "false" = sem proxy.
 *
 * Contagem de saltos (ex.: "1") é recusada: desde o Fastify 5.12 um número
 * faz o servidor ignorar o X-Forwarded-For de todo mundo, porque contar saltos
 * não confirma quem está do outro lado e um cliente direto poderia forjar o IP.
 * Falhar na inicialização é melhor do que o rate limit ver todos com o IP do proxy.
 */
export function trustProxyDeEnv(valor: string | undefined): string | false {
  const bruto = valor?.trim() ?? "";
  if (bruto === "" || bruto === "0" || bruto.toLowerCase() === "false") return false;
  if (/^\d+$/.test(bruto)) {
    throw new Error(
      `TRUST_PROXY="${bruto}" (contagem de saltos) não é mais aceito. Informe o endereço ou a rede do proxy, ` +
        `por exemplo TRUST_PROXY=uniquelocal (Coolify/Docker) ou um CIDR como 10.0.1.0/24.`
    );
  }
  const itens = bruto.split(",").map((x) => x.trim()).filter(Boolean);
  for (const item of itens) {
    if (PREDEFINIDOS.has(item)) continue;
    const [ip, prefixo] = item.split("/");
    const versao = isIP(ip);
    const prefixoOk =
      prefixo === undefined ||
      (/^\d+$/.test(prefixo) && Number(prefixo) <= (versao === 6 ? 128 : 32));
    if (!versao || !prefixoOk) {
      throw new Error(`TRUST_PROXY: "${item}" não é IP, rede CIDR nem um de loopback/linklocal/uniquelocal.`);
    }
  }
  return itens.join(",");
}
