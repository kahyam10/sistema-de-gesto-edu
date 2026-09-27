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
 * 0–10. Avaliações sem nota do aluno não entram (nem no peso). Duas casas.
 */
export function mediaPonderada(notas: NotaAvaliada[]): number | null {
  let soma = 0;
  let pesos = 0;
  for (const n of notas) {
    soma += notaNaEscala(n.valor, n.valorMaximo) * n.peso;
    pesos += n.peso;
  }
  return pesos > 0 ? Math.round((soma / pesos) * 100) / 100 : null;
}
