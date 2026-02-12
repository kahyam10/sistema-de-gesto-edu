"use client";

import { MatriculasManager } from "./MatriculasManager";

/**
 * Gerenciador de Alunos - atualmente reutiliza MatriculasManager
 * pois a gestão de alunos está integrada com matrículas
 */
export function AlunosManager() {
  return <MatriculasManager />;
}
