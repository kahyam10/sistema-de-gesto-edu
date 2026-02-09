import { MultipartFile } from "@fastify/multipart";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { join } from "path";
import { randomUUID } from "crypto";

/**
 * Serviço de upload de arquivos
 * Salva arquivos localmente em uploads/documentos/
 */

export class UploadService {
  private uploadDir = join(process.cwd(), "uploads", "documentos");

  constructor() {
    // Garante que o diretório existe
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Valida tipo de arquivo permitido
   */
  private isValidFileType(mimetype: string): boolean {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    return allowedTypes.includes(mimetype);
  }

  /**
   * Valida tamanho do arquivo (max 5MB)
   */
  private isValidFileSize(file: Buffer): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.length <= maxSize;
  }

  /**
   * Gera nome único para o arquivo
   */
  private generateFileName(originalName: string): string {
    const ext = originalName.split(".").pop();
    return `${randomUUID()}.${ext}`;
  }

  /**
   * Salva arquivo no disco
   */
  async saveFile(file: MultipartFile): Promise<{ path: string; filename: string }> {
    // Valida tipo
    if (!this.isValidFileType(file.mimetype)) {
      throw new Error(
        "Tipo de arquivo não permitido. Use: JPG, PNG, GIF, WEBP ou PDF"
      );
    }

    // Gera nome único
    const filename = this.generateFileName(file.filename);
    const filepath = join(this.uploadDir, filename);

    // Salva arquivo
    await pipeline(file.file, createWriteStream(filepath));

    // Retorna path relativo
    return {
      path: `/uploads/documentos/${filename}`,
      filename,
    };
  }

  /**
   * Salva múltiplos arquivos
   */
  async saveFiles(files: MultipartFile[]): Promise<Array<{ path: string; filename: string }>> {
    const results = [];
    for (const file of files) {
      const result = await this.saveFile(file);
      results.push(result);
    }
    return results;
  }

  /**
   * Remove arquivo do disco
   */
  async deleteFile(filename: string): Promise<void> {
    const filepath = join(this.uploadDir, filename);
    if (existsSync(filepath)) {
      const fs = await import("fs/promises");
      await fs.unlink(filepath);
    }
  }
}

export const uploadService = new UploadService();
