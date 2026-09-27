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
