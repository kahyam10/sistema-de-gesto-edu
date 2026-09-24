import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { FileError, NotFoundError } from "../errors/index.js";
import { getStorageDriver } from "../storage/index.js";
import type { TipoDocumentoMatricula } from "../schemas/index.js";

export interface UploadDocumentoInput {
  matriculaId: string;
  tipo: TipoDocumentoMatricula;
  nomeOriginal: string;
  mimeType: string;
  buffer: Buffer;
  uploadedById: string;
  uploadedByNome: string;
}

// MIME permitidos → extensão canônica (extensão NUNCA vem do nome original)
const MIME_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB — manter igual ao limits.fileSize do @fastify/multipart (server.ts)

// Assinaturas (magic bytes) — barra conteúdo que não corresponde ao MIME declarado
function assinaturaValida(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  switch (mimeType) {
    case "application/pdf":
      return buffer.subarray(0, 4).toString("latin1") === "%PDF";
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    default:
      return false;
  }
}

export class DocumentoMatriculaService {
  async list(matriculaId: string) {
    const matricula = await prisma.matricula.findUnique({ where: { id: matriculaId } });
    if (!matricula) throw new NotFoundError("NF_004");
    return prisma.documentoMatricula.findMany({
      where: { matriculaId },
      orderBy: { createdAt: "desc" },
    });
  }

  async upload(input: UploadDocumentoInput) {
    const matricula = await prisma.matricula.findUnique({
      where: { id: input.matriculaId },
    });
    if (!matricula) throw new NotFoundError("NF_004");

    const extensao = MIME_PERMITIDOS[input.mimeType];
    if (!extensao) {
      throw new FileError("FILE_004", {
        mimeType: input.mimeType,
        permitidos: Object.keys(MIME_PERMITIDOS),
      });
    }
    if (input.buffer.length > TAMANHO_MAXIMO_BYTES) {
      throw new FileError("FILE_006", { tamanho: input.buffer.length });
    }
    if (input.buffer.length === 0 || !assinaturaValida(input.buffer, input.mimeType)) {
      throw new FileError("FILE_005", { mimeType: input.mimeType });
    }

    const storage = getStorageDriver();
    const storageKey = `matriculas/${input.matriculaId}/${randomUUID()}.${extensao}`;
    await storage.save(storageKey, input.buffer, input.mimeType);

    try {
      return await prisma.$transaction(async (tx) => {
        const documento = await tx.documentoMatricula.create({
          data: {
            tipo: input.tipo,
            nomeOriginal: input.nomeOriginal,
            mimeType: input.mimeType,
            tamanho: input.buffer.length,
            storageKey,
            matriculaId: input.matriculaId,
            uploadedById: input.uploadedById,
            uploadedByNome: input.uploadedByNome,
          },
        });
        // Checklist (jsonb Record<tipo, boolean>): anexar digitalizado marca o tipo como entregue
        const checklist = {
          ...((matricula.documentosEntregues as Record<string, boolean> | null) ?? {}),
        };
        checklist[input.tipo] = true;
        await tx.matricula.update({
          where: { id: input.matriculaId },
          data: { documentosEntregues: checklist },
        });
        return documento;
      });
    } catch (error) {
      // rollback do arquivo físico se o banco falhar (best-effort)
      await storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  /** Retorna metadados + stream para download. */
  async download(matriculaId: string, documentoId: string) {
    const documento = await prisma.documentoMatricula.findFirst({
      where: { id: documentoId, matriculaId },
    });
    if (!documento) throw new NotFoundError("NF_029");
    const stream: Readable = await getStorageDriver().stream(documento.storageKey);
    return { documento, stream };
  }

  async delete(matriculaId: string, documentoId: string) {
    const documento = await prisma.documentoMatricula.findFirst({
      where: { id: documentoId, matriculaId },
    });
    if (!documento) throw new NotFoundError("NF_029");

    await prisma.$transaction(async (tx) => {
      await tx.documentoMatricula.delete({ where: { id: documentoId } });
      // Último arquivo do tipo? Desmarca no checklist
      const restantes = await tx.documentoMatricula.count({
        where: { matriculaId, tipo: documento.tipo },
      });
      if (restantes === 0) {
        const matricula = await tx.matricula.findUnique({ where: { id: matriculaId } });
        if (matricula) {
          const checklist = {
            ...((matricula.documentosEntregues as Record<string, boolean> | null) ?? {}),
          };
          checklist[documento.tipo] = false;
          await tx.matricula.update({
            where: { id: matriculaId },
            data: { documentosEntregues: checklist },
          });
        }
      }
    });
    // Arquivo físico por último: se falhar, o registro já saiu (órfão é inócuo e logado)
    await getStorageDriver().delete(documento.storageKey);
    return { message: "Documento deletado com sucesso" };
  }

  /** Remove só os arquivos físicos (usado antes do cascade em matriculaService.delete). */
  async expurgarArquivos(matriculaId: string): Promise<number> {
    const documentos = await prisma.documentoMatricula.findMany({
      where: { matriculaId },
      select: { storageKey: true },
    });
    const storage = getStorageDriver();
    for (const doc of documentos) {
      await storage.delete(doc.storageKey);
    }
    return documentos.length;
  }

  /** Expurgo LGPD completo: arquivos + registros + checklist zerado. */
  async expurgar(matriculaId: string) {
    const matricula = await prisma.matricula.findUnique({ where: { id: matriculaId } });
    if (!matricula) throw new NotFoundError("NF_004");
    const arquivosRemovidos = await this.expurgarArquivos(matriculaId);
    await prisma.$transaction(async (tx) => {
      await tx.documentoMatricula.deleteMany({ where: { matriculaId } });
      await tx.matricula.update({
        where: { id: matriculaId },
        data: { documentosEntregues: Prisma.DbNull },
      });
    });
    return { message: "Documentos expurgados com sucesso", arquivosRemovidos };
  }
}

export const documentoMatriculaService = new DocumentoMatriculaService();
