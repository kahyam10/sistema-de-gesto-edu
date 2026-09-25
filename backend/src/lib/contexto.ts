// Contexto de acesso da requisição (AsyncLocalStorage): quem está chamando e
// qual o escopo de dados que essa pessoa pode enxergar. Preenchido pelo guard
// global (app.ts) e lido pela extensão do Prisma (lib/escopo.ts).
import { AsyncLocalStorage } from "node:async_hooks";

export type Escopo =
  // Direção, coordenação e secretaria: só a própria escola (null = sem escola → nada)
  | { tipo: "ESCOLA"; escolaId: string | null }
  // Professor: só as turmas em que leciona (e as escolas dessas turmas)
  | { tipo: "PROFESSOR"; profissionalId: string | null; turmaIds: string[]; escolaIds: string[] };

export interface ContextoAcesso {
  escopo?: Escopo;
  papel?: string;
  /** cache de verificações de pertinência dentro da mesma requisição */
  cache: Map<string, boolean>;
}

export const contextoAcesso = new AsyncLocalStorage<ContextoAcesso>();

export const contextoAtual = () => contextoAcesso.getStore();

/** Papéis cujo acesso a dados é limitado à própria escola */
export const PAPEIS_DA_ESCOLA = new Set(["DIRETOR", "COORDENADOR", "SECRETARIA"]);
