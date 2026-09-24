import { LocalDiskDriver } from "./local-disk.driver.js";
import type { StorageDriver } from "./storage-driver.js";

let driver: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  if (driver) return driver;
  const tipo = process.env.STORAGE_DRIVER || "local";
  switch (tipo) {
    case "local":
      driver = new LocalDiskDriver();
      break;
    // case "s3": ver ponto de extensão documentado em storage-driver.ts
    default:
      throw new Error(
        `STORAGE_DRIVER desconhecido: "${tipo}". Valores suportados: "local".`
      );
  }
  return driver;
}

/** Uso exclusivo em testes: força recriação do driver após mudar env. */
export function resetStorageDriver(): void {
  driver = null;
}

export type { StorageDriver } from "./storage-driver.js";
