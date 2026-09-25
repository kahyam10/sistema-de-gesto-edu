import { PrismaClient } from "@prisma/client";
import { contextoAtual } from "./contexto.js";
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
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
});

const delegado = (model: string) =>
  (prismaSemEscopo as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[
    model.charAt(0).toLowerCase() + model.slice(1)
  ];

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
        const pertence = async (pai: string, id: string) => {
          const chave = `${pai}:${id}`;
          const emCache = ctx!.cache.get(chave);
          if (emCache !== undefined) return emCache;
          const filtro = filtroLeitura(pai, escopo);
          const ok = filtro
            ? (await delegado(pai).count({ where: { AND: [{ id }, filtro] } })) > 0
            : true;
          ctx!.cache.set(chave, ok);
          return ok;
        };

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
          for (const d of lista) await validarDados(model, d as Record<string, unknown>, escopo, pertence, true);
          return query(a);
        }
        if (operation === "upsert") {
          const filtro = filtroEscrita(model, escopo);
          if (filtro) a.where = juntarUnico(a.where, filtro);
          await validarDados(model, a.create as Record<string, unknown>, escopo, pertence, true);
          await validarDados(model, a.update as Record<string, unknown>, escopo, pertence);
          return query(a);
        }
        return query(a);
      },
    },
  },
});
