import { z } from "zod";

// ==================== PARÂMETROS NUMÉRICOS DE QUERY/ROTA ====================
// Antes eram convertidos com parseInt sem validação: "abc" virava NaN e
// "1e9"/"-3" passavam direto para o Prisma (500 ou consulta sem sentido).
// Agora: inteiro, faixa coerente, 400 de validação no formato padrão.

const semVazio = (v: unknown) => (v === "" || v === null ? undefined : v);
/** Inteiro vindo de texto: só dígitos (sem "1.5", "1e3", " 2", "0x10"). */
const inteiroTexto = (min: number, max: number, rotulo: string) =>
  z
    .union([z.string().max(12).regex(/^-?\d+$/, `${rotulo} deve ser um número inteiro`), z.number()])
    .pipe(
      z.coerce
        .number()
        .int(`${rotulo} deve ser um número inteiro`)
        .min(min, `${rotulo} deve estar entre ${min} e ${max}`)
        .max(max, `${rotulo} deve estar entre ${min} e ${max}`)
    );
const opcional = <T extends z.ZodTypeAny>(s: T) => z.preprocess(semVazio, s.optional());

export const bimestreParam = inteiroTexto(1, 4, "Bimestre");
export const mesParam = inteiroTexto(1, 12, "Mês");
export const anoParam = inteiroTexto(2000, 2100, "Ano");
export const diasParam = inteiroTexto(1, 3650, "Dias");

/** GET /api/notas?bimestre= */
export const bimestreOpcionalQuerySchema = z.object({ bimestre: opcional(bimestreParam) });
/** GET /api/matriculas e /sem-turma: anoLetivo opcional */
export const anoLetivoOpcionalQuerySchema = z.object({ anoLetivo: opcional(anoParam) });
/** GET /api/matriculas/estatisticas: anoLetivo obrigatório */
export const anoLetivoObrigatorioQuerySchema = z.object({
  anoLetivo: z.preprocess(semVazio, anoParam),
});
/** GET /api/motoristas/alertas-cnh?dias= (padrão 30) */
export const diasAlertaQuerySchema = z.object({ dias: opcional(diasParam).transform((v) => v ?? 30) });
/** GET /api/pontos/relatorio/:profissionalId/:mes/:ano */
export const relatorioMensalParamsSchema = z.object({
  profissionalId: z.string().min(1).max(255),
  mes: mesParam,
  ano: anoParam,
});
/** GET /api/licencas/relatorio/:profissionalId?anoInicio=&anoFim= */
export const periodoAnosQuerySchema = z
  .object({ anoInicio: opcional(anoParam), anoFim: opcional(anoParam) })
  .refine((d) => d.anoInicio === undefined || d.anoFim === undefined || d.anoFim >= d.anoInicio, {
    message: "anoFim deve ser maior ou igual a anoInicio",
    path: ["anoFim"],
  });
