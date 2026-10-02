/**
 * O guard de autenticação/autorização decide pela URL crua (request.raw.url),
 * mas o roteador do Fastify DECODIFICA %xx antes de escolher a rota: sem esta
 * trava, "/%61pi/escolas" passava pelo guard (não começa com "/api") e ainda
 * assim executava a rota /api/escolas sem login. Os parâmetros de caminho da
 * API são só ids, então nenhum caminho legítimo precisa de %, #, \, // ou
 * segmentos "." / "..": qualquer um deles é recusado antes do guard.
 */
export function caminhoSuspeito(caminho: string): boolean {
  return /[%#\\]|\/\/|\/\.{1,2}(\/|$)/.test(caminho);
}
