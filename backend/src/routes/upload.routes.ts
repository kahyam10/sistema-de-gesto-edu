import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { uploadService } from "../services/upload.service.js";
import { prisma } from "../lib/prisma.js";

export async function uploadRoutes(app: FastifyInstance) {
  // Upload de documento para matrícula
  app.post(
    "/matricula/:matriculaId/documento",
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ error: "Nenhum arquivo enviado" });
        }

        // Salva arquivo
        const result = await uploadService.saveFile(data);

        // Pega o tipo de documento do campo 'tipo'
        const fields = data.fields as { tipo?: { value: string } };
        const tipoDocumento = fields.tipo?.value || "outros";

        // Atualiza matrícula com o path do documento
        const updateData: Record<string, string> = {};
        switch (tipoDocumento) {
          case "foto":
            updateData.fotoAluno = result.path;
            break;
          case "rg":
            updateData.documentoRG = result.path;
            break;
          case "cpf":
            updateData.documentoCPF = result.path;
            break;
          case "comprovante":
            updateData.comprovanteResidencia = result.path;
            break;
          case "certidao":
            updateData.certidaoNascimento = result.path;
            break;
          case "historico":
            updateData.historicoEscolar = result.path;
            break;
          default:
            // Adiciona a outros documentos
            const matricula = await prisma.matricula.findUnique({
              where: { id: matriculaId },
              select: { outrosDocumentos: true },
            });

            const outrosArray = matricula?.outrosDocumentos
              ? JSON.parse(matricula.outrosDocumentos)
              : [];

            outrosArray.push({
              nome: data.filename,
              path: result.path,
              tipo: tipoDocumento,
            });

            updateData.outrosDocumentos = JSON.stringify(outrosArray);
        }

        const matriculaAtualizada = await prisma.matricula.update({
          where: { id: matriculaId },
          data: updateData,
        });

        return reply.send({
          message: "Documento enviado com sucesso",
          path: result.path,
          matricula: matriculaAtualizada,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao enviar documento";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Upload múltiplo de documentos
  app.post(
    "/matricula/:matriculaId/documentos",
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const parts = request.parts();
        const uploadedFiles: Array<{ nome: string; path: string; tipo: string }> = [];

        for await (const part of parts) {
          if (part.type === "file") {
            const result = await uploadService.saveFile(part);
            const fields = part.fields as { tipo?: { value: string } };
            uploadedFiles.push({
              nome: part.filename,
              path: result.path,
              tipo: fields.tipo?.value || "outros",
            });
          }
        }

        if (uploadedFiles.length === 0) {
          return reply.status(400).send({ error: "Nenhum arquivo enviado" });
        }

        // Atualiza matrícula com todos os documentos
        const matricula = await prisma.matricula.findUnique({
          where: { id: matriculaId },
          select: { outrosDocumentos: true },
        });

        const outrosArray = matricula?.outrosDocumentos
          ? JSON.parse(matricula.outrosDocumentos)
          : [];

        const novosDocumentos = [...outrosArray, ...uploadedFiles];

        await prisma.matricula.update({
          where: { id: matriculaId },
          data: {
            outrosDocumentos: JSON.stringify(novosDocumentos),
          },
        });

        return reply.send({
          message: `${uploadedFiles.length} documento(s) enviado(s) com sucesso`,
          arquivos: uploadedFiles,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao enviar documentos";
        return reply.status(400).send({ error: message });
      }
    }
  );

  // Listar documentos de uma matrícula
  app.get(
    "/matricula/:matriculaId/documentos",
    async (
      request: FastifyRequest<{
        Params: { matriculaId: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { matriculaId } = request.params;
        const matricula = await prisma.matricula.findUnique({
          where: { id: matriculaId },
          select: {
            fotoAluno: true,
            documentoRG: true,
            documentoCPF: true,
            comprovanteResidencia: true,
            certidaoNascimento: true,
            historicoEscolar: true,
            outrosDocumentos: true,
          },
        });

        if (!matricula) {
          return reply.status(404).send({ error: "Matrícula não encontrada" });
        }

        const documentos = {
          foto: matricula.fotoAluno,
          rg: matricula.documentoRG,
          cpf: matricula.documentoCPF,
          comprovante: matricula.comprovanteResidencia,
          certidao: matricula.certidaoNascimento,
          historico: matricula.historicoEscolar,
          outros: matricula.outrosDocumentos
            ? JSON.parse(matricula.outrosDocumentos)
            : [],
        };

        return reply.send(documentos);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao buscar documentos";
        return reply.status(400).send({ error: message });
      }
    }
  );
}
