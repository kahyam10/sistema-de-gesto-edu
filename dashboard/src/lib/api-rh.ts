// Camada de API do Módulo 4 — ACs por área e quadro de lotação
import { request } from "./api";

export type AreaAC =
  | "LINGUAGENS" | "MATEMATICA" | "CIENCIAS_NATUREZA" | "CIENCIAS_HUMANAS" | "ENSINO_RELIGIOSO"
  | "ANOS_INICIAIS" | "EDUCACAO_INFANTIL" | "AEE" | "GERAL";
export type DiaSemana = "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO";

export const AREAS_AC: Array<{ valor: AreaAC; rotulo: string }> = [
  { valor: "LINGUAGENS", rotulo: "Linguagens" },
  { valor: "MATEMATICA", rotulo: "Matemática" },
  { valor: "CIENCIAS_NATUREZA", rotulo: "Ciências da Natureza" },
  { valor: "CIENCIAS_HUMANAS", rotulo: "Ciências Humanas" },
  { valor: "ENSINO_RELIGIOSO", rotulo: "Ensino Religioso" },
  { valor: "ANOS_INICIAIS", rotulo: "Anos Iniciais" },
  { valor: "EDUCACAO_INFANTIL", rotulo: "Educação Infantil" },
  { valor: "AEE", rotulo: "AEE" },
  { valor: "GERAL", rotulo: "Geral" },
];
export const DIAS: Array<{ valor: DiaSemana; rotulo: string }> = [
  { valor: "SEGUNDA", rotulo: "Segunda" },
  { valor: "TERCA", rotulo: "Terça" },
  { valor: "QUARTA", rotulo: "Quarta" },
  { valor: "QUINTA", rotulo: "Quinta" },
  { valor: "SEXTA", rotulo: "Sexta" },
  { valor: "SABADO", rotulo: "Sábado" },
];

export interface AtividadeComplementar {
  id: string;
  escolaId: string;
  escola: { id: string; nome: string };
  area: AreaAC;
  titulo: string | null;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  local: string | null;
  coordenadorId: string | null;
  coordenador: { id: string; nome: string } | null;
  observacoes: string | null;
  ativo: boolean;
  participantes: Array<{ id: string; nome: string }>;
}

export interface DadosAC {
  escolaId: string;
  area: AreaAC;
  titulo?: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  local?: string;
  coordenadorId?: string;
  observacoes?: string;
  participantes: string[];
  ativo?: boolean;
}

export interface LinhaLotacao {
  profissional: { id: string; nome: string; tipo: string; regimeContratacao: string | null; ativo: boolean };
  jornadaHoras: number | null;
  lotacaoNaEscola: { funcao: string | null; cargaHoraria: number | null } | null;
  disciplinasNaEscola: string[];
  horas: {
    regenciaNaEscola: number; regenciaTotal: number; acNaEscola: number; acTotal: number;
    limiteRegencia: number | null; saldo: number | null;
  };
  conflitos: Array<{ diaSemana: string; entre: [string, string] }>;
  alertas: Array<{ codigo: string; mensagem: string }>;
}

export interface QuadroLotacao {
  escola: { id: string; nome: string };
  fracaoMaximaRegencia: number;
  resumo: { profissionais: number; comAlerta: number; regenciaNaEscola: number; acNaEscola: number };
  profissionais: LinhaLotacao[];
}

export const acsApi = {
  list: (filtros: { escolaId?: string; area?: string; diaSemana?: string; ativo?: boolean }) => {
    const p = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => v !== undefined && v !== "" && p.append(k, String(v)));
    const q = p.toString();
    return request<AtividadeComplementar[]>(`/api/atividades-complementares${q ? `?${q}` : ""}`);
  },
  create: (dados: DadosAC) =>
    request<AtividadeComplementar>("/api/atividades-complementares", { method: "POST", body: dados }),
  update: (id: string, dados: Partial<DadosAC>) =>
    request<AtividadeComplementar>(`/api/atividades-complementares/${id}`, { method: "PUT", body: dados }),
};

export const lotacaoApi = {
  quadro: (escolaId: string) =>
    request<QuadroLotacao>(`/api/lotacao/quadro?escolaId=${encodeURIComponent(escolaId)}`),
};
