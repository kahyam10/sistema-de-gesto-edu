/**
 * Hoje no formato AAAA-MM-DD no fuso da Bahia (UTC-3 fixo, sem horário de
 * verão). Cálculo manual: o Intl do Hermes nem sempre traz fusos/locales.
 */
export function hojeISO(agora: Date = new Date()): string {
  return new Date(agora.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "2026-09-24" ou ISO completo → "24/09/2026" (sem deslocar o dia por fuso). */
export function dataBR(valor: string): string {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function nota(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "—" : valor.toFixed(1).replace(".", ",");
}

export const rotuloPapel: Record<string, string> = {
  PROFESSOR: "Professor(a)",
  RESPONSAVEL: "Responsável",
  USER: "Aluno(a)",
  ADMIN: "Administrador",
  SEMEC: "SEMEC",
  DIRETOR: "Direção",
  COORDENADOR: "Coordenação",
  SECRETARIA: "Secretaria",
};

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Dia da semana de "AAAA-MM-DD" (calculado em UTC para não deslocar o dia). */
export function diaDaSemana(valor: string, curto = false): string {
  const d = new Date(`${valor.slice(0, 10)}T12:00:00Z`).getUTCDay();
  return (curto ? DIAS_CURTOS : DIAS)[d];
}

/** "2026-09-25" → "Sex, 25 de setembro". */
export function dataPorExtenso(valor: string): string {
  const [, m, d] = valor.slice(0, 10).split("-").map(Number);
  return `${diaDaSemana(valor, true)}, ${d} de ${MESES[m - 1]}`;
}

/** "2026-09-25" → "25/09". */
export function diaMes(valor: string): string {
  const [, m, d] = valor.slice(0, 10).split("-");
  return `${d}/${m}`;
}

/** Saudação pela hora da Bahia (UTC-3). */
export function saudacao(agora: Date = new Date()): string {
  const h = new Date(agora.getTime() - 3 * 60 * 60 * 1000).getUTCHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

/** Converte "7,5" / "7.5" em número; "" → null; lixo → NaN. */
export function lerNumero(texto: string): number | null {
  const t = texto.trim().replace(",", ".");
  if (t === "") return null;
  return /^\d+(\.\d*)?$/.test(t) ? Number(t) : NaN;
}

/** "25/09/2026" → "2026-09-25" (ou null se inválida). */
export function dataBRparaISO(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [, d, mes, a] = m;
  const iso = `${a}-${mes}-${d}`;
  const data = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.getUTCDate() !== Number(d) || data.getUTCMonth() + 1 !== Number(mes)) return null;
  return iso;
}

/** Média simples ignorando vazios; null se não há valores. */
export function media(valores: Array<number | null | undefined>): number | null {
  const v = valores.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

/** "MATUTINO" → "Matutino"; "AVISO" → "Aviso". */
export function capitalizar(texto: string): string {
  const t = texto.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "Ana", "Ana e Pedro", "Ana, Pedro e Lia" — só primeiros nomes. */
export function listaDeNomes(nomes: string[]): string {
  const p = nomes.map((n) => n.trim().split(/\s+/)[0]);
  if (p.length <= 1) return p.join("");
  return `${p.slice(0, -1).join(", ")} e ${p[p.length - 1]}`;
}

export const TIPOS_AVALIACAO = ["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"] as const;
export type TipoAvaliacao = (typeof TIPOS_AVALIACAO)[number];
export const rotuloTipoAvaliacao: Record<string, string> = {
  PROVA: "Prova", TRABALHO: "Trabalho", ATIVIDADE: "Atividade", PARTICIPACAO: "Participação", RECUPERACAO: "Recuperação",
};

/** Iniciais para avatar: primeira letra do primeiro e do último nome (ignora "de", "da"...). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2);
  if (partes.length === 0) return nome.slice(0, 2).toUpperCase();
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (partes[0][0] + ultima).toUpperCase();
}

/** Instante ISO → "14:05" no horário da Bahia (UTC-3). */
export function horaBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** Instante ISO → "25/09 às 14:05" (Bahia). */
export function dataHoraBR(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 60 * 60 * 1000).toISOString();
  return `${diaMes(d)} às ${horaBR(iso)}`;
}

export const rotuloEvento: Record<string, string> = {
  INICIO_ANO_LETIVO: "Início do ano letivo", FIM_ANO_LETIVO: "Fim do ano letivo",
  INICIO_AULAS_REGULARES: "Início das aulas", FIM_AULAS_REGULARES: "Fim das aulas",
  FERIADO: "Feriado", RECESSO: "Recesso", SABADO_LETIVO: "Sábado letivo", EVENTO: "Evento", AC: "AC",
  AVALIACAO: "Avaliação", REUNIAO: "Reunião", CONSELHO_CLASSE: "Conselho de classe",
  PLANEJAMENTO: "Planejamento", FORMACAO: "Formação", OUTRO: "Outro",
};

export const rotuloRefeicao: Record<string, string> = {
  CAFE_MANHA: "Café da manhã", LANCHE_MANHA: "Lanche da manhã", ALMOCO: "Almoço",
  LANCHE_TARDE: "Lanche da tarde", JANTAR: "Jantar", CEIA: "Ceia",
};
