import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma.js";
import {
  documentoMatriculaService,
  TAMANHO_MAXIMO_BYTES,
} from "../src/services/documento-matricula.service.js";
import { matriculaService } from "../src/services/matricula.service.js";
import { LocalDiskDriver } from "../src/storage/local-disk.driver.js";

// Conteúdos mínimos com magic bytes válidos
const PDF_VALIDO = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(64, 0x20)]);
const PNG_VALIDO = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const raiz = path.resolve("./.uploads-test");

const baseMatricula = {
  anoLetivo: 2026,
  status: "ATIVA",
  nomeAluno: "Aluno Documentos",
  dataNascimento: new Date("2015-03-10"),
  sexo: "M",
  nomeResponsavel: "Responsável Documentos",
};

let escola: { id: string };
let etapa: { id: string };
let matricula: { id: string };
let uploader: { uploadedById: string; uploadedByNome: string };

// Cria matrícula auxiliar (testes de expurgo/integração usam matrículas próprias)
async function criarMatricula(nomeAluno: string) {
  return matriculaService.create({
    ...baseMatricula,
    nomeAluno,
    escolaId: escola.id,
    etapaId: etapa.id,
  } as Parameters<typeof matriculaService.create>[0]);
}

describe("DocumentoMatriculaService", () => {
  beforeAll(async () => {
    // Limpeza na ordem de dependência + seed mínimo (tipo→etapa→escola→matrícula→user)
    await rm(raiz, { recursive: true, force: true });
    await prisma.documentoMatricula.deleteMany();
    await prisma.transferenciaMatricula.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.escolaEtapa.deleteMany();
    await prisma.escola.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Educação Regular Docs Teste" },
    });
    etapa = await prisma.etapaEnsino.create({
      data: { nome: "Ensino Fundamental Docs Teste", tipoEducacaoId: tipo.id },
    });
    escola = await prisma.escola.create({
      data: { nome: "Escola Docs", codigo: "TESTE-DOCS" },
    });
    matricula = await criarMatricula("Aluno Documentos");

    const user = await prisma.user.upsert({
      where: { email: "secretaria.docs@teste.edu.br" },
      update: {},
      create: {
        email: "secretaria.docs@teste.edu.br",
        password: "senha-hash-teste",
        nome: "Secretaria Teste",
        role: "SECRETARIA",
      },
    });
    uploader = { uploadedById: user.id, uploadedByNome: user.nome };
  });

  afterAll(async () => {
    await rm(raiz, { recursive: true, force: true });
  });

  it("faz upload de PDF válido: cria arquivo no disco, registro e marca checklist", async () => {
    const doc = await documentoMatriculaService.upload({
      matriculaId: matricula.id,
      tipo: "CERTIDAO_NASCIMENTO",
      nomeOriginal: "certidao.pdf",
      mimeType: "application/pdf",
      buffer: PDF_VALIDO,
      ...uploader,
    });

    expect(doc.storageKey).toMatch(
      new RegExp(`^matriculas/${matricula.id}/[\\w-]+\\.pdf$`)
    );
    expect(doc.tamanho).toBe(PDF_VALIDO.length);
    expect(doc.uploadedByNome).toBe("Secretaria Teste");
    expect(existsSync(path.join(raiz, doc.storageKey))).toBe(true);

    const m = await prisma.matricula.findUnique({ where: { id: matricula.id } });
    const checklist = m!.documentosEntregues as Record<string, boolean>;
    expect(checklist.CERTIDAO_NASCIMENTO).toBe(true);
  });

  it("rejeita MIME fora da whitelist (FILE_004) sem persistir nada", async () => {
    await expect(
      documentoMatriculaService.upload({
        matriculaId: matricula.id,
        tipo: "OUTRO",
        nomeOriginal: "virus.exe",
        mimeType: "application/x-msdownload",
        buffer: PDF_VALIDO,
        ...uploader,
      })
    ).rejects.toThrow("Tipo de arquivo não permitido");

    const registros = await prisma.documentoMatricula.count({
      where: { matriculaId: matricula.id, tipo: "OUTRO" },
    });
    expect(registros).toBe(0);
  });

  it("rejeita arquivo acima de 10MB (FILE_006)", async () => {
    const grande = Buffer.concat([
      Buffer.from("%PDF-"),
      Buffer.alloc(TAMANHO_MAXIMO_BYTES + 1),
    ]);
    await expect(
      documentoMatriculaService.upload({
        matriculaId: matricula.id,
        tipo: "OUTRO",
        nomeOriginal: "grande.pdf",
        mimeType: "application/pdf",
        buffer: grande,
        ...uploader,
      })
    ).rejects.toThrow(/tamanho máximo/);
  });

  it("rejeita conteúdo que não bate com o MIME declarado (FILE_005)", async () => {
    await expect(
      documentoMatriculaService.upload({
        matriculaId: matricula.id,
        tipo: "OUTRO",
        nomeOriginal: "fake.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("nao sou pdf"),
        ...uploader,
      })
    ).rejects.toThrow(/corrompido|inválido/i);
  });

  it("download retorna stream com o conteúdo idêntico e metadados", async () => {
    const doc = await documentoMatriculaService.upload({
      matriculaId: matricula.id,
      tipo: "FOTO_3X4",
      nomeOriginal: "foto.png",
      mimeType: "image/png",
      buffer: PNG_VALIDO,
      ...uploader,
    });

    const { documento, stream } = await documentoMatriculaService.download(
      matricula.id,
      doc.id
    );
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).equals(PNG_VALIDO)).toBe(true);
    expect(documento.mimeType).toBe("image/png");
    expect(documento.nomeOriginal).toBe("foto.png");
  });

  it("delete remove registro + arquivo e desmarca o tipo se era o último", async () => {
    const doc = await documentoMatriculaService.upload({
      matriculaId: matricula.id,
      tipo: "CARTAO_SUS",
      nomeOriginal: "cartao-sus.pdf",
      mimeType: "application/pdf",
      buffer: PDF_VALIDO,
      ...uploader,
    });
    expect(existsSync(path.join(raiz, doc.storageKey))).toBe(true);

    await documentoMatriculaService.delete(matricula.id, doc.id);

    const registro = await prisma.documentoMatricula.findUnique({
      where: { id: doc.id },
    });
    expect(registro).toBeNull();
    expect(existsSync(path.join(raiz, doc.storageKey))).toBe(false);

    const m = await prisma.matricula.findUnique({ where: { id: matricula.id } });
    const checklist = m!.documentosEntregues as Record<string, boolean>;
    expect(checklist.CARTAO_SUS).toBe(false);
    // Os demais tipos entregues permanecem intactos
    expect(checklist.CERTIDAO_NASCIMENTO).toBe(true);
  });

  it("expurgar apaga todos os arquivos, registros e zera o checklist", async () => {
    const alvo = await criarMatricula("Aluno Expurgo");
    const doc1 = await documentoMatriculaService.upload({
      matriculaId: alvo.id,
      tipo: "RG_ALUNO",
      nomeOriginal: "rg.pdf",
      mimeType: "application/pdf",
      buffer: PDF_VALIDO,
      ...uploader,
    });
    const doc2 = await documentoMatriculaService.upload({
      matriculaId: alvo.id,
      tipo: "FOTO_3X4",
      nomeOriginal: "foto.png",
      mimeType: "image/png",
      buffer: PNG_VALIDO,
      ...uploader,
    });

    const resultado = await documentoMatriculaService.expurgar(alvo.id);
    expect(resultado.arquivosRemovidos).toBe(2);

    const restantes = await prisma.documentoMatricula.count({
      where: { matriculaId: alvo.id },
    });
    expect(restantes).toBe(0);
    expect(existsSync(path.join(raiz, doc1.storageKey))).toBe(false);
    expect(existsSync(path.join(raiz, doc2.storageKey))).toBe(false);

    const m = await prisma.matricula.findUnique({ where: { id: alvo.id } });
    expect(m!.documentosEntregues).toBeNull();
  });

  it("excluir a matrícula expurga os arquivos físicos (integração LGPD)", async () => {
    const alvo = await criarMatricula("Aluno Exclusão LGPD");
    const doc = await documentoMatriculaService.upload({
      matriculaId: alvo.id,
      tipo: "COMPROVANTE_RESIDENCIA",
      nomeOriginal: "comprovante.pdf",
      mimeType: "application/pdf",
      buffer: PDF_VALIDO,
      ...uploader,
    });
    expect(existsSync(path.join(raiz, doc.storageKey))).toBe(true);

    await matriculaService.delete(alvo.id);

    // Arquivo físico removido antes do cascade apagar os registros
    expect(existsSync(path.join(raiz, doc.storageKey))).toBe(false);
    const registros = await prisma.documentoMatricula.count({
      where: { matriculaId: alvo.id },
    });
    expect(registros).toBe(0);
  });

  it("driver local bloqueia path traversal em qualquer chave com ..", async () => {
    const driver = new LocalDiskDriver("./.uploads-test");
    await expect(driver.get("../fora-da-raiz.txt")).rejects.toThrow(
      /inválida|corrompido/i
    );
    await expect(
      driver.save("../../etc/pwned", Buffer.from("x"), "application/pdf")
    ).rejects.toThrow();
    expect(existsSync(path.resolve("./etc/pwned"))).toBe(false);
  });
});
