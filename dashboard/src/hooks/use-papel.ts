import { useAuth } from "@/lib/auth";

/** Papéis de gestão da rede (espelha GESTAO em backend/src/lib/rbac.ts). */
export const PAPEIS_GESTAO = ["ADMIN", "SEMEC"] as const;

/**
 * true para ADMIN/SEMEC. Serve só para não oferecer na tela o que o servidor
 * recusa (ex.: excluir escola, turma, matrícula, profissional; estrutura
 * pedagógica). A autorização de verdade continua no servidor.
 */
export function useEhGestao(): boolean {
  const { user } = useAuth();
  return !!user && (PAPEIS_GESTAO as readonly string[]).includes(user.role);
}

/**
 * Exportações oficiais (Educacenso/Sistema Presença), licenças e ponto:
 * ADMIN, SEMEC e COORDENADOR (o coordenador só da própria escola, filtrado no
 * servidor). Espelha RH_EXPORTACAO em backend/src/lib/rbac.ts — mude os dois
 * juntos. DIRETOR, SECRETARIA e PROFESSOR não têm acesso.
 */
export const PAPEIS_RH = ["ADMIN", "SEMEC", "COORDENADOR"] as const;

/** Versão pura (sem hook) para o menu e para testes. */
export function podeRH(role: string | undefined): boolean {
  return role !== undefined && (PAPEIS_RH as readonly string[]).includes(role);
}

/**
 * true para quem pode ver/usar exportações, licenças e ponto. Só esconde o que
 * o servidor recusa (403); a autorização de verdade continua no servidor.
 */
export function usePodeRH(): boolean {
  const { user } = useAuth();
  return podeRH(user?.role);
}
