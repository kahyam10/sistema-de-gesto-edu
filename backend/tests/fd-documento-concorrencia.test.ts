// Frente D — checklist de documentos atualizado de forma atômica: uploads
// simultâneos não apagam a marca um do outro. Dados 100% fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { documentoMatriculaService } from "../src/services/documento-matricula.service.js";
import type { TipoDocumentoMatricula } from "../src/schemas/index.js";
import { criarEstrutura, criarAluno } from "./fd-fixture.js";

const PDF = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(32, 0x20)]);
let e: Awaited<ReturnType<typeof criarEstrutura>>;
const matriculas: string[] = [];
let uploader: { uploadedById: string; uploadedByNome: string };

const upload = (matriculaId: string, tipo: TipoDocumentoMatricula) =>
  documentoMatriculaService.upload({ matriculaId, tipo, nomeOriginal: `${tipo}.pdf`, mimeType: "application/pdf", buffer: PDF, ...uploader });
const checklist = async (id: string) =>
  ((await prisma.matricula.findUnique({ where: { id } }))!.documentosEntregues ?? {}) as Record<string, boolean>;

beforeAll(async () => {
  e = await criarEstrutura("FDD");
  const user = await prisma.user.create({
    data: { email: "secretaria.fdd@teste.local", password: "hash-ficticio", nome: "Secretaria FDD", role: "SECRETARIA" },
  });
  uploader = { uploadedById: user.id, uploadedByNome: user.nome };
});

afterAll(async () => {
  // Remove os arquivos físicos criados por este arquivo
  for (const id of matriculas) await documentoMatriculaService.expurgar(id);
});

describe("checklist de documentos sob concorrência", () => {
  it("dois uploads simultâneos de tipos diferentes: as duas marcas ficam", async () => {
    const m = await criarAluno("FDD", e, "Gil FDD");
    matriculas.push(m.id);
    await Promise.all([upload(m.id, "RG_ALUNO"), upload(m.id, "CPF_ALUNO")]);
    expect(await checklist(m.id)).toEqual({ RG_ALUNO: true, CPF_ALUNO: true });
  });

  it("vários uploads simultâneos preservam marcas manuais pré-existentes", async () => {
    const m = await criarAluno("FDD", e, "Leo FDD");
    matriculas.push(m.id);
    await prisma.matricula.update({ where: { id: m.id }, data: { documentosEntregues: { FOTO_3X4: true, HISTORICO_ESCOLAR: false } } });
    const tipos: TipoDocumentoMatricula[] = ["CERTIDAO_NASCIMENTO", "CARTAO_SUS", "CADERNETA_VACINACAO", "COMPROVANTE_RESIDENCIA", "RG_RESPONSAVEL"];
    await Promise.all(tipos.map((t) => upload(m.id, t)));
    expect(await checklist(m.id)).toEqual({
      FOTO_3X4: true,
      HISTORICO_ESCOLAR: false,
      ...Object.fromEntries(tipos.map((t) => [t, true])),
    });
    expect(await prisma.documentoMatricula.count({ where: { matriculaId: m.id } })).toBe(tipos.length);
  });

  it("exclusão do último arquivo de um tipo em paralelo a upload de outro tipo", async () => {
    const m = await criarAluno("FDD", e, "Mia FDD");
    matriculas.push(m.id);
    const rg = await upload(m.id, "RG_ALUNO");
    await Promise.all([documentoMatriculaService.delete(m.id, rg.id), upload(m.id, "CPF_RESPONSAVEL")]);
    expect(await checklist(m.id)).toEqual({ RG_ALUNO: false, CPF_RESPONSAVEL: true });
  });
});
