// Média das avaliações de um bimestre, usada no boletim, na média por
// bimestre e no acompanhamento de aprendizagens (uma fonte só).

/** Escala em que médias e a média mínima da configuração são expressas. */
export const ESCALA_NOTA = 10;

export interface NotaAvaliada {
  valor: number;
  valorMaximo: number;
  peso: number;
}

/**
 * Converte a nota para a escala 0–10: uma prova que vale 5 e teve 4 conta
 * como 8. Sem isso, a média misturava escalas (4 de 5 entrava como 4 de 10).
 */
export function notaNaEscala(valor: number, valorMaximo: number): number {
  return valorMaximo > 0 ? (valor / valorMaximo) * ESCALA_NOTA : valor;
}

/**
 * Média ponderada pelo peso de cada avaliação, com as notas já na escala
 * 0–10. Duas casas. Quem decide o que entra é `notasParaMedia` (avaliação
 * realizada sem nota = 0); aqui só se faz a conta.
 *
 * Peso negativo conta como 0. Se a soma dos pesos for 0 (dado legado com
 * peso 0 em todas — a entrada já proíbe peso <= 0), cai na média simples
 * em vez de devolver null para sempre (null = "sem média", o que deixaria o
 * aluno EM_CURSO eternamente).
 */
export function mediaPonderada(notas: NotaAvaliada[]): number | null {
  if (notas.length === 0) return null;
  let soma = 0;
  let pesos = 0;
  for (const n of notas) {
    const peso = n.peso > 0 ? n.peso : 0;
    soma += notaNaEscala(n.valor, n.valorMaximo) * peso;
    pesos += peso;
  }
  if (pesos === 0) {
    soma = notas.reduce((t, n) => t + notaNaEscala(n.valor, n.valorMaximo), 0);
    pesos = notas.length;
  }
  return Math.round((soma / pesos) * 100) / 100;
}

/** Uma avaliação do bimestre vista para UM aluno (nota null = não lançada). */
export interface AvaliacaoDoAluno {
  data: Date;
  peso: number;
  valorMaximo: number;
  nota: number | null;
}

const diaUTC = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/**
 * O que entra na média do aluno (decisão da rede):
 * - avaliação com nota lançada: entra com a nota;
 * - avaliação JÁ REALIZADA (data <= hoje na rede) sem nota do aluno: entra
 *   como 0 (antes ficava de fora e inflava a média de quem faltou à prova);
 * - avaliação FUTURA sem nota: ainda não entra.
 * `hoje` é uma data pura (meia-noite UTC), como `hojeNaRede()`.
 */
export function notasParaMedia(avaliacoes: AvaliacaoDoAluno[], hoje: Date): NotaAvaliada[] {
  const limite = diaUTC(hoje);
  const out: NotaAvaliada[] = [];
  for (const av of avaliacoes) {
    if (av.nota !== null) out.push({ valor: av.nota, valorMaximo: av.valorMaximo, peso: av.peso });
    else if (diaUTC(av.data) <= limite) out.push({ valor: 0, valorMaximo: av.valorMaximo, peso: av.peso });
  }
  return out;
}

/** Média do aluno num conjunto de avaliações (null = nenhuma realizada nem com nota). */
export function mediaDasAvaliacoes(avaliacoes: AvaliacaoDoAluno[], hoje: Date): number | null {
  return mediaPonderada(notasParaMedia(avaliacoes, hoje));
}

/** Média final = média simples das médias dos bimestres que têm média. Duas casas. */
export function mediaDosBimestres(medias: Array<number | null>): number | null {
  const xs = medias.filter((m): m is number => m !== null);
  if (xs.length === 0) return null;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100;
}
