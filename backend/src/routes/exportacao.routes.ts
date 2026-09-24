import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";
import { AppError, formatarErroZod } from "../errors/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { exportacaoEducacensoService } from "../services/exportacao-educacenso.service.js";
import { exportacaoPresencaService } from "../services/exportacao-presenca.service.js";
import {
  exportacaoEducacensoQuerySchema,
  exportacaoPresencaQuerySchema,
} from "../schemas/exportacao.schemas.js";

export async function exportacaoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Exportação Educacenso/INEP — TXT de migração (ou prévia JSON)
  app.get(
    "/educacenso",
    {
      schema: {
        tags: ["Exportação"],
        summary:
          "Exporta arquivo TXT de migração do Educacenso (layout simplificado)",
        description: `
Gera o arquivo pipe-delimited (registros 00/20/30/40/50/60/99) em ISO-8859-1
com uma linha por registro, agrupado por escola.

**⚠️ Layout SIMPLIFICADO**: subconjunto documentado do layout de migração
oficial. Valide no sistema oficial do Educacenso antes de submeter.

**Formatos:**
- Sem \`formato\` (ou \`formato=txt\`): download do arquivo \`.txt\`
  (Content-Disposition: attachment).
- \`formato=json\`: prévia com \`{ nomeArquivo, conteudo, resumo, pendencias }\`
  — relatório de pendências com campos faltantes (nível ERRO/AVISO).
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["anoLetivoId"],
          properties: {
            anoLetivoId: {
              type: "string",
              description: "ID (cuid) do ano letivo",
              example: "cm3abc1234567890",
            },
            escolaId: {
              type: "string",
              description: "Restringe a uma escola (default: rede toda)",
              example: "cm3def1234567890",
            },
            formato: {
              type: "string",
              enum: ["txt", "json"],
              description: "txt = download; json = prévia com pendências",
              example: "json",
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          anoLetivoId: string;
          escolaId?: string;
          formato?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const query = exportacaoEducacensoQuerySchema.parse(request.query);
        const resultado =
          await exportacaoEducacensoService.gerarEducacenso(query);

        if (query.formato === "json") {
          return reply.status(200).send(resultado);
        }

        return reply
          .status(200)
          .header("Content-Type", "text/plain; charset=ISO-8859-1")
          .header(
            "Content-Disposition",
            `attachment; filename="${resultado.nomeArquivo}"`
          )
          .send(Buffer.from(resultado.conteudo, "latin1"));
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar exportação do Educacenso";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Exportação Sistema Presença (Bolsa Família) — CSV (ou prévia JSON)
  app.get(
    "/sistema-presenca",
    {
      schema: {
        tags: ["Exportação"],
        summary:
          "Exporta CSV de baixa frequência para o Sistema Presença (Bolsa Família)",
        description: `
Lista alunos com frequência mensal abaixo do limiar da condicionalidade de
educação do Bolsa Família (Lei 14.601/2023 e Decreto 11.566/2023):
**60%** para 4–5 anos (pré-escola) e **75%** para 6–17 anos.

Faltas justificadas NÃO contam como presença, mas saem em coluna própria
(\`faltas_justificadas\`) para lançamento do motivo no Sistema Presença.

**Formatos:**
- Sem \`formato\` (ou \`formato=csv\`): download do \`.csv\`
  (separador \`;\`, UTF-8 com BOM — abre direto no Excel PT-BR).
- \`formato=json\`: prévia com \`{ nomeArquivo, resumo, linhas }\`.
        `,
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          required: ["anoLetivoId", "mes"],
          properties: {
            anoLetivoId: {
              type: "string",
              description: "ID (cuid) do ano letivo",
              example: "cm3abc1234567890",
            },
            mes: {
              type: "integer",
              minimum: 1,
              maximum: 12,
              description: "Mês de referência (1-12)",
              example: 7,
            },
            escolaId: {
              type: "string",
              description: "Restringe a uma escola (default: rede toda)",
              example: "cm3def1234567890",
            },
            formato: {
              type: "string",
              enum: ["csv", "json"],
              description: "csv = download; json = prévia",
              example: "json",
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: {
          anoLetivoId: string;
          mes: string;
          escolaId?: string;
          formato?: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const query = exportacaoPresencaQuerySchema.parse(request.query);
        const resultado =
          await exportacaoPresencaService.gerarSistemaPresenca(query);

        if (query.formato === "json") {
          return reply.status(200).send({
            nomeArquivo: resultado.nomeArquivo,
            resumo: resultado.resumo,
            linhas: resultado.linhas,
          });
        }

        return reply
          .status(200)
          .header("Content-Type", "text/csv; charset=utf-8")
          .header(
            "Content-Disposition",
            `attachment; filename="${resultado.nomeArquivo}"`
          )
          .send(resultado.conteudo);
      } catch (error: unknown) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        if (error instanceof ZodError) {
          return reply.status(400).send(formatarErroZod(error));
        }
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao gerar exportação do Sistema Presença";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
