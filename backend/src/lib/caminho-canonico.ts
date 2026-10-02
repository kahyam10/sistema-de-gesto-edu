// Caminho canônico da requisição para AUTORIZAÇÃO.
//
// O roteador (find-my-way) decodifica %xx, ignora "#..." e aceita variações
// que o texto cru da URL não mostra: "/%61pi/escolas" cai na rota
// "/api/escolas", mas um guard que olha request.raw.url enxerga "/%61pi/..."
// e não exige login. Por isso a autorização usa SÓ o caminho reconstruído a
// partir da rota que o roteador escolheu (routeOptions.url + params), e a
// requisição é recusada (400) quando o caminho cru não é exatamente esse.
import type { FastifyRequest } from "fastify";

// Nada de codificação, fragmento, barras duplicadas/invertidas nem segmentos
// "." / ".." no caminho cru (sem a querystring).
const PROIBIDO = /[%#\\]|\/\/|\/\.\.?(\/|$)/;

const semBarraFinal = (s: string) => (s.length > 1 && s.endsWith("/") ? s.slice(0, -1) : s);

/** Parte do caminho de uma URL crua, sem a querystring. */
export function caminhoCru(rawUrl: string | undefined): string {
  const url = rawUrl ?? "";
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}

/**
 * Remonta o caminho concreto a partir do padrão da rota e dos params já
 * decodificados. Devolve null para padrões que não sabemos remontar com
 * segurança (regex, multiparâmetro, "::") — o chamador recusa a requisição.
 */
export function reconstruirCaminho(rota: string, params: unknown): string | null {
  const p = (params ?? {}) as Record<string, unknown>;
  const partes = rota.split("/");
  const saida: string[] = [];
  for (let i = 0; i < partes.length; i++) {
    const seg = partes[i];
    if (seg === "*") {
      // curinga só no fim; o valor pode conter "/"
      if (i !== partes.length - 1) return null;
      const v = p["*"];
      if (typeof v !== "string") return null;
      saida.push(v);
      continue;
    }
    if (seg.startsWith(":")) {
      const nome = seg.slice(1);
      if (!/^[A-Za-z0-9_]+$/.test(nome)) return null;
      const v = p[nome];
      if (typeof v !== "string" || v.length === 0 || v.includes("/")) return null;
      saida.push(v);
      continue;
    }
    if (/[:*(]/.test(seg)) return null;
    saida.push(seg);
  }
  return saida.join("/");
}

export type CaminhoCanonico =
  | { ok: true; caminho: string; rotaEncontrada: boolean }
  | { ok: false };

/**
 * Decide o caminho usado pela autorização.
 * - caminho cru com %, #, \, //, /./ ou /../ → inválido;
 * - rota encontrada → caminho remontado, que precisa ser idêntico ao cru
 *   (tolerada só a barra final, que o Fastify registra junto com o prefixo);
 * - sem rota (404) → o próprio caminho cru (já sem nada ambíguo).
 */
export function resolverCaminho(
  rawUrl: string | undefined,
  rota: string | undefined,
  params: unknown
): CaminhoCanonico {
  const cru = caminhoCru(rawUrl);
  if (!cru.startsWith("/") || PROIBIDO.test(cru)) return { ok: false };
  if (!rota) return { ok: true, caminho: cru, rotaEncontrada: false };
  const remontado = reconstruirCaminho(rota, params);
  if (remontado === null || PROIBIDO.test(remontado)) return { ok: false };
  if (semBarraFinal(cru) !== semBarraFinal(remontado)) return { ok: false };
  return { ok: true, caminho: semBarraFinal(remontado), rotaEncontrada: true };
}

export function caminhoCanonicoDe(request: FastifyRequest): CaminhoCanonico {
  return resolverCaminho(request.raw.url, request.routeOptions?.url, request.params);
}
