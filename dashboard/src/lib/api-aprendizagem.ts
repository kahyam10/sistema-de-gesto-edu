// Camada de API do Módulo 2 — acompanhamento de aprendizagens
import { request } from "./api";

export type CodigoMotivo = "ABAIXO_DA_MEDIA" | "FREQUENCIA_BAIXA" | "QUEDA" | "SEM_NOTA";

export interface RegraAvaliacao {
  mediaMinima: number;
  frequenciaMinima: number;
  origem: "CONFIGURACAO" | "PADRAO";
}

export interface ResumoTurma {
  alunos: number;
  emAtencao: number;
  frequenciaBaixa: number;
  mediaGeral: number | null;
}

export interface TurmaInfo {
  id: string;
  nome: string;
  turno: string;
  anoLetivo: number;
  escola: string;
  serie: string;
}

export interface AprendizagemTurma {
  turma: TurmaInfo;
  regra: RegraAvaliacao;
  bimestre: number;
  bimestresComAvaliacao: number[];
  resumo: ResumoTurma;
  disciplinas: Array<{
    disciplinaId: string;
    nome: string;
    avaliacoes: number;
    mediaTurma: number | null;
    alunosComNota: number;
    abaixoDaMedia: number;
  }>;
  alunos: Array<{
    matriculaId: string;
    nomeAluno: string;
    numeroMatricula: string;
    frequencia: number | null;
    mediaGeral: number | null;
    disciplinas: Array<{ disciplinaId: string; media: number | null; mediaAnterior: number | null }>;
    motivos: Array<{ codigo: CodigoMotivo; texto: string }>;
  }>;
}

export interface AprendizagemEscola {
  escola: { id: string; nome: string };
  anoLetivo: number;
  anosDisponiveis: number[];
  turmas: Array<{ turma: TurmaInfo; bimestre: number; resumo: ResumoTurma; regra: RegraAvaliacao }>;
}

export const aprendizagemApi = {
  escola: (escolaId: string, anoLetivo?: number) =>
    request<AprendizagemEscola>(
      `/api/aprendizagem/escola/${encodeURIComponent(escolaId)}${anoLetivo ? `?anoLetivo=${anoLetivo}` : ""}`
    ),
  turma: (turmaId: string, bimestre?: number) =>
    request<AprendizagemTurma>(
      `/api/aprendizagem/turma/${encodeURIComponent(turmaId)}${bimestre ? `?bimestre=${bimestre}` : ""}`
    ),
};
