import { createReadStream } from "node:fs";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { FileError } from "../errors/index.js";
import type { StorageDriver } from "./storage-driver.js";

/**
 * Driver de disco local. Raiz configurável via UPLOADS_DIR (padrão ./uploads).
 * O diretório fica FORA do git (ver .gitignore) e, no Docker, em volume nomeado.
 */
export class LocalDiskDriver implements StorageDriver {
  private readonly root: string;

  constructor(root: string = process.env.UPLOADS_DIR || "./uploads") {
    this.root = path.resolve(root);
  }

  /** Resolve a chave dentro da raiz; qualquer tentativa de escapar (.., absoluto) é rejeitada. */
  private resolveKey(key: string): string {
    const destino = path.resolve(this.root, key);
    if (!destino.startsWith(this.root + path.sep)) {
      throw new FileError("FILE_005", { motivo: "Chave de storage inválida", key });
    }
    return destino;
  }

  async save(key: string, data: Buffer, _mimeType: string): Promise<void> {
    const destino = this.resolveKey(key);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, data);
  }

  async get(key: string): Promise<Buffer> {
    const origem = this.resolveKey(key);
    try {
      return await readFile(origem);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new FileError("FILE_002", { key });
      }
      throw new FileError("FILE_001", { key });
    }
  }

  async stream(key: string): Promise<Readable> {
    const origem = this.resolveKey(key);
    if (!(await this.exists(key))) {
      throw new FileError("FILE_002", { key });
    }
    return createReadStream(origem);
  }

  async delete(key: string): Promise<void> {
    const alvo = this.resolveKey(key);
    try {
      await unlink(alvo);
    } catch (error: unknown) {
      // idempotente: arquivo já ausente não é erro (expurgo pode repetir)
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new FileError("FILE_003", { key });
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
}
