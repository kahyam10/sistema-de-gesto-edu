import type { Readable } from "node:stream";

/**
 * Contrato de storage de arquivos.
 *
 * Chaves ("key") são caminhos relativos com "/" (ex.: "matriculas/<id>/<uuid>.pdf"),
 * SEMPRE geradas pelo servidor — nunca derivadas de input do usuário.
 *
 * PONTO DE EXTENSÃO S3/Supabase Storage: criar src/storage/s3.driver.ts
 * implementando esta interface com @aws-sdk/client-s3
 * (save → PutObjectCommand, get → GetObjectCommand + transformToByteArray,
 * stream → GetObjectCommand.Body as Readable, delete → DeleteObjectCommand,
 * exists → HeadObjectCommand com catch de NotFound) e registrar o case "s3"
 * no factory de src/storage/index.ts. Envs previstas: STORAGE_DRIVER=s3,
 * S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 * S3_FORCE_PATH_STYLE=true (necessário para Supabase).
 */
export interface StorageDriver {
  save(key: string, data: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  stream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
