// ==================== EXPORTAÇÕES OFICIAIS (EDUCACENSO / SISTEMA PRESENÇA) ====================
// Camada de API própria do módulo (padrão api-<modulo>.ts) — importa a base de "./api".

import { request, ApiError, API_BASE_URL } from "./api";

// ---------- Educacenso ----------

export interface PendenciaEducacenso {
  linha: number; // 1-based no arquivo TXT
  registro: "00" | "20" | "30" | "40" | "50" | "60";
  entidade:
    | "ESCOLA"
    | "TURMA"
    | "PESSOA"
    | "VINCULO_GESTOR"
    | "VINCULO_DOCENTE"
    | "VINCULO_ALUNO";
  entidadeId: string;
  entidadeNome: string;
  campo: string;
  posicao: number;
  nivel: "ERRO" | "AVISO";
  motivo: string;
}

export interface ResumoEducacenso {
  ano: number;
  totalEscolas: number;
  totalTurmas: number;
  totalAlunos: number;
  totalProfissionais: number;
  totalLinhas: number;
  totalPendencias: number;
  pendenciasPorNivel: { ERRO: number; AVISO: number };
}

export interface EducacensoPrevia {
  nomeArquivo: string;
  conteudo: string;
  resumo: ResumoEducacenso;
  pendencias: PendenciaEducacenso[];
}

// ---------- Sistema Presença ----------

export interface LinhaSistemaPresenca {
  codigoInepEscola: string;
  nomeEscola: string;
  nomeAluno: string;
  nisAluno: string;
  dataNascimento: string; // DD/MM/AAAA
  serie: string;
  turma: string;
  turno: string;
  idade: number;
  faixaEtaria: "PRE_ESCOLA_4_5" | "FUNDAMENTAL_MEDIO_6_17";
  limiarFrequencia: 60 | 75;
  totalAulas: number;
  presencas: number;
  faltas: number;
  faltasJustificadas: number;
  percentualFrequencia: number;
  periodo: string; // "MM/AAAA"
}

export interface ResumoSistemaPresenca {
  ano: number;
  mes: number;
  totalAvaliados: number;
  totalBaixaFrequencia: number;
  alunosSemRegistro: number;
  alunosForaFaixaEtaria: number;
}

export interface PresencaPrevia {
  nomeArquivo: string;
  resumo: ResumoSistemaPresenca;
  linhas: LinhaSistemaPresenca[];
}

// ---------- Params ----------

export interface EducacensoParams {
  anoLetivoId: string;
  escolaId?: string;
}

export interface PresencaParams {
  anoLetivoId: string;
  mes: number;
  escolaId?: string;
}

// Download binário: mesmo padrão do documentosMatriculaApi.download (api.ts),
// com Authorization do localStorage e filename vindo do Content-Disposition.
async function requestDownload(
  endpoint: string,
  fallbackFilename: string
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Erro desconhecido" }));
    throw new ApiError(response.status, error.error || "Erro na requisição");
  }
  const cd = response.headers.get("Content-Disposition");
  const filename = cd?.match(/filename="([^"]+)"/)?.[1] ?? fallbackFilename;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function qsEducacenso(params: EducacensoParams): URLSearchParams {
  const qs = new URLSearchParams({ anoLetivoId: params.anoLetivoId });
  if (params.escolaId) qs.set("escolaId", params.escolaId);
  return qs;
}

function qsPresenca(params: PresencaParams): URLSearchParams {
  const qs = new URLSearchParams({
    anoLetivoId: params.anoLetivoId,
    mes: String(params.mes),
  });
  if (params.escolaId) qs.set("escolaId", params.escolaId);
  return qs;
}

export const exportacoesApi = {
  previaEducacenso: (params: EducacensoParams) => {
    const qs = qsEducacenso(params);
    qs.set("formato", "json");
    return request<EducacensoPrevia>(`/api/exportacao/educacenso?${qs}`);
  },
  downloadEducacenso: (params: EducacensoParams) =>
    requestDownload(
      `/api/exportacao/educacenso?${qsEducacenso(params)}`,
      "educacenso.txt"
    ),
  previaSistemaPresenca: (params: PresencaParams) => {
    const qs = qsPresenca(params);
    qs.set("formato", "json");
    return request<PresencaPrevia>(`/api/exportacao/sistema-presenca?${qs}`);
  },
  downloadSistemaPresenca: (params: PresencaParams) =>
    requestDownload(
      `/api/exportacao/sistema-presenca?${qsPresenca(params)}`,
      "sistema-presenca.csv"
    ),
};
