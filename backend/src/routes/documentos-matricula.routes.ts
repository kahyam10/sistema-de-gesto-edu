import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { auditar } from "../lib/auditoria.js";
import { FileError } from "../errors/index.js";
import { documentoMatriculaService } from "../services/documento-matricula.service.js";
import { uploadDocumentoMatriculaQuerySchema } from "../schemas/index.js";
import { responderErroRota } from "../lib/erro-rota.js";

export async function documentosMatriculaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // POST /api/matriculas/:matriculaId/documentos?tipo=CERTIDAO_NASCIMENTO
  app.post(
    "/:matriculaId/documentos",
    {
      schema: {
        tags: ["Documentos da Matrícula"],
        summary: "Upload de documento digitalizado da matrícula",
        description:
          "Envia um arquivo (multipart, campo `arquivo`) vinculado à matrícula.\n\n" +
          "- Tipos aceitos: PDF, JPG, PNG — máx. 10MB\n" +
          "- `tipo` do documento vai na querystring\n" +
          "- Anexar marca o tipo como entregue no checklist `documentosEntregues`",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        params: {
          type: "object",
          properties: { matriculaId: { type: "string", example: "cm4abc123" } },
        },
        querystring: {
          type: "object",
          properties: { tipo: { type: "string", example: "CERTIDAO_NASCIMENTO" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string }; Querystring: { tipo: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const { tipo } = uploadDocumentoMatriculaQuerySchema.parse(request.query);

        const file = await request.file();
        if (!file) {
          return reply
            .status(400)
            .send({ error: "Nenhum arquivo enviado (campo 'arquivo')" });
        }

        let buffer: Buffer;
        try {
          buffer = await file.toBuffer();
        } catch (err: unknown) {
          if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
            throw new FileError("FILE_006");
          }
          throw err;
        }

        const user = request.user as { id: string; nome: string };
        const documento = await documentoMatriculaService.upload({
          matriculaId,
          tipo,
          nomeOriginal: file.filename,
          mimeType: file.mimetype,
          buffer,
          uploadedById: user.id,
          uploadedByNome: user.nome,
        });
        return reply.status(201).send(documento);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/matriculas/:matriculaId/documentos
  app.get(
    "/:matriculaId/documentos",
    {
      schema: {
        tags: ["Documentos da Matrícula"],
        summary: "Lista os documentos digitalizados de uma matrícula",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { matriculaId: { type: "string", example: "cm4abc123" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const documentos = await documentoMatriculaService.list(request.params.matriculaId);
        return reply.status(200).send(documentos);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // GET /api/matriculas/:matriculaId/documentos/:documentoId/download
  app.get(
    "/:matriculaId/documentos/:documentoId/download",
    {
      schema: {
        tags: ["Documentos da Matrícula"],
        summary: "Download (stream) de um documento",
        description: "Responde com o binário e `Content-Disposition: attachment`.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            matriculaId: { type: "string", example: "cm4abc123" },
            documentoId: { type: "string", example: "cm4doc456" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string; documentoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId, documentoId } = request.params;
        const { documento, stream } = await documentoMatriculaService.download(
          matriculaId,
          documentoId
        );
        await auditar(request, {
          acao: "DOCUMENTO_DOWNLOAD",
          recurso: "documento_matricula",
          recursoId: documentoId,
          detalhes: { matriculaId, tipo: documento.tipo },
        });
        const nomeAscii = documento.nomeOriginal.replace(/[^\w.\- ]/g, "_");
        return reply
          .status(200)
          .header("Content-Type", documento.mimeType)
          .header("Content-Length", documento.tamanho)
          .header(
            "Content-Disposition",
            `attachment; filename="${nomeAscii}"; filename*=UTF-8''${encodeURIComponent(documento.nomeOriginal)}`
          )
          .send(stream);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // DELETE /api/matriculas/:matriculaId/documentos/:documentoId  (OPERACAO)
  app.delete(
    "/:matriculaId/documentos/:documentoId",
    {
      schema: {
        tags: ["Documentos da Matrícula"],
        summary: "Exclui um documento (arquivo + registro)",
        description:
          "Se for o último arquivo do tipo, desmarca o tipo no checklist `documentosEntregues`.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            matriculaId: { type: "string", example: "cm4abc123" },
            documentoId: { type: "string", example: "cm4doc456" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string; documentoId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const resultado = await documentoMatriculaService.delete(
          request.params.matriculaId,
          request.params.documentoId
        );
        await auditar(request, {
          acao: "DOCUMENTO_EXCLUSAO",
          recurso: "documento_matricula",
          recursoId: request.params.documentoId,
          detalhes: { matriculaId: request.params.matriculaId },
        });
        return reply.status(200).send(resultado);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );

  // DELETE /api/matriculas/:matriculaId/documentos  — EXPURGO LGPD (GESTAO)
  app.delete(
    "/:matriculaId/documentos",
    {
      schema: {
        tags: ["Documentos da Matrícula"],
        summary: "Expurgo LGPD: remove TODOS os documentos da matrícula",
        description:
          "Apaga arquivos físicos, registros e zera o checklist. Restrito a ADMIN/SEMEC.\n" +
          "Ver política em docs/LGPD_RETENCAO.md.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { matriculaId: { type: "string", example: "cm4abc123" } },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { matriculaId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const resultado = await documentoMatriculaService.expurgar(request.params.matriculaId);
        await auditar(request, {
          acao: "DOCUMENTOS_EXPURGO",
          recurso: "matricula",
          recursoId: request.params.matriculaId,
          detalhes: { arquivosRemovidos: resultado.arquivosRemovidos ?? null },
        });
        return reply.status(200).send(resultado);
      } catch (error: unknown) {
        return responderErroRota(error, reply);
      }
    }
  );
}
