import { PrismaClient } from "@prisma/client";
import { contextoAtual, type ContextoAcesso, type Escopo } from "./contexto.js";
import {
  OPERACOES_ESCRITA_FILTRADA,
  OPERACOES_LEITURA,
  filtroEscrita,
  filtroLeitura,
  juntar,
  juntarUnico,
  validarDados,
} from "./escopo.js";

// Cliente "cru": só para a própria extensão verificar pertinência e para
// rotinas de sistema que precisam enxergar tudo. NÃO usar em rotas.
export const prismaSemEscopo = new PrismaClient({
  // Mensagens de erro do Prisma sem trecho de query/código (nada de dados ou
  // estrutura vazando para logs/respostas)
  errorFormat: "minimal",
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
});

type DelegadoMinimo = { findMany: (a: unknown) => Promise<Array<{ id: string }>> };
const delegado = (model: string) =>
  (prismaSemEscopo as unknown as Record<string, DelegadoMinimo>)[model.charAt(0).toLowerCase() + model.slice(1)];

// Verificação de pertinência EM LOTE: as checagens pedidas na mesma volta do
// event loop (ex.: os 35 creates/upserts de uma chamada de frequência, que
// rodam juntos num $transaction) viram UMA consulta por model-pai, com
// "id IN (...)". Mesma semântica de antes: id fora do filtro do escopo (ou
// inexistente) = não pertence → a escrita é negada.
interface LotePendente {
  ids: Set<string>;
  pronto: Promise<void>;
}
const lotesPorRequisicao = new WeakMap<ContextoAcesso, Map<string, LotePendente>>();

/** Contador de consultas de pertinência (observabilidade e testes). */
export const metricasPertinencia = { consultas: 0 };

function pertenceEmLote(ctx: ContextoAcesso, escopo: Escopo, pai: string, id: string): Promise<boolean> {
  const chave = `${pai}:${id}`;
  const emCache = ctx.cache.get(chave);
  if (emCache !== undefined) return Promise.resolve(emCache);
  const filtro = filtroLeitura(pai, escopo);
  if (!filtro) return Promise.resolve(true);

  let porPai = lotesPorRequisicao.get(ctx);
  if (!porPai) {
    porPai = new Map();
    lotesPorRequisicao.set(ctx, porPai);
  }
  let lote = porPai.get(pai);
  if (!lote) {
    const ids = new Set<string>();
    const mapa = porPai;
    const pronto = new Promise<void>((resolve, reject) => {
      setImmediate(() => {
        mapa.delete(pai); // pedidos a partir daqui abrem um lote novo
        const lista = [...ids];
        metricasPertinencia.consultas++;
        // Promise.resolve().then: qualquer exceção vira rejeição (nunca trava quem espera)
        Promise.resolve()
          .then(() => delegado(pai).findMany({ where: { AND: [{ id: { in: lista } }, filtro] }, select: { id: true } }))
          .then((achados) => {
            const ok = new Set(achados.map((a) => a.id));
            for (const i of lista) ctx.cache.set(`${pai}:${i}`, ok.has(i));
            resolve();
          })
          .catch(reject);
      });
    });
    lote = { ids, pronto };
    porPai.set(pai, lote);
  }
  lote.ids.add(id);
  return lote.pronto.then(() => ctx.cache.get(chave) === true);
}

/**
 * Cliente usado por TODA a aplicação. Quando a requisição tem escopo (direção,
 * coordenação, secretaria ou professor — ver app.ts), cada consulta recebe o
 * filtro de escola/turma e cada escrita tem suas chaves verificadas.
 */
export const prisma = prismaSemEscopo.$extends({
  name: "escopo-por-escola",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = contextoAtual();
        const escopo = ctx?.escopo;
        if (!escopo || !model) return query(args);

        const a = (args ?? {}) as Record<string, unknown>;
        const pertence = (pai: string, id: string) => pertenceEmLote(ctx!, escopo, pai, id);

        if (OPERACOES_LEITURA.has(operation)) {
          const filtro = filtroLeitura(model, escopo);
          if (filtro) {
            a.where = operation.startsWith("findUnique") ? juntarUnico(a.where, filtro) : juntar(a.where, filtro);
          }
          return query(a);
        }

        if (OPERACOES_ESCRITA_FILTRADA.has(operation)) {
          const filtro = filtroEscrita(model, escopo);
          if (filtro) {
            a.where = operation === "update" || operation === "delete" ? juntarUnico(a.where, filtro) : juntar(a.where, filtro);
          }
          if (a.data) await validarDados(model, a.data as Record<string, unknown>, escopo, pertence);
          return query(a);
        }

        if (operation === "create") {
          await validarDados(model, a.data as Record<string, unknown>, escopo, pertence, true);
          return query(a);
        }
        if (operation === "createMany" || operation === "createManyAndReturn") {
          const lista = Array.isArray(a.data) ? a.data : [a.data];
          await Promise.all(lista.map((d) => validarDados(model, d as Record<string, unknown>, escopo, pertence, true)));
          return query(a);
        }
        if (operation === "upsert") {
          const filtro = filtroEscrita(model, escopo);
          if (filtro) a.where = juntarUnico(a.where, filtro);
          await Promise.all([
            validarDados(model, a.create as Record<string, unknown>, escopo, pertence, true),
            validarDados(model, a.update as Record<string, unknown>, escopo, pertence),
          ]);
          return query(a);
        }
        return query(a);
      },
    },
  },
});
