// Frente F: ajustes deixados pelas frentes de segurança/corretude.
// Comunicados com o usuário da sessão, anexo só https, escopo nos includes
// (escola/série/profissional), documentoPath da licença, situação EM_CURSO,
// erros de negócio de licenças/pontos e parâmetros numéricos validados.
// Dados fictícios.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { prisma } from "../src/lib/prisma.js";
import { buildApp } from "../src/app.js";
import { _resetarLimiteLogin } from "../src/lib/limite-login.js";
import { getStorageDriver } from "../src/storage/index.js";
import { cenarioDuasEscolas, entrar, itens } from "./fb-cenario.js";

let app: FastifyInstance;
let c: Awaited<ReturnType<typeof cenarioDuasEscolas>>;
let profC: { id: string; nome: string };
let disciplinaId: string;
const ids: Record<string, string> = {};
const tokens = new Map<string, { authorization: string }>();
const req = async (email: string, method: string, url: string, payload?: unknown) => {
  if (!tokens.has(email)) tokens.set(email, await entrar(app, email));
  return app.inject({ method: method as "GET", url, headers: tokens.get(email)!, ...(payload ? { payload: payload as object } : {}) });
};
const novoComunicado = (extra: Record<string, unknown> = {}) => ({
  titulo: "Aviso fictício ff", mensagem: "Texto", tipo: "AVISO", destinatarios: "PAIS", autorNome: "SEMEC", ...extra,
});

beforeAll(async () => {
  _resetarLimiteLogin();
  c = await cenarioDuasEscolas("ff91");
  const ontem = new Date(Date.now() - 86400000);
  const amanha = new Date(Date.now() + 86400000);
  const com = async (chave: string, data: Record<string, unknown>) => {
    ids[chave] = (await prisma.comunicado.create({
      data: { mensagem: "x", tipo: "AVISO", autorNome: "Gestão", dataPublicacao: ontem, ...data } as never,
    })).id;
  };
  await com("redePais", { titulo: "ff Rede: aos pais", destinatarios: "PAIS" });
  await com("redeProf", { titulo: "ff Rede: aos professores", destinatarios: "PROFESSORES" });
  await com("aTodos", { titulo: "ff A: a todos", destinatarios: "TODOS", escolaId: c.escolaA.id });
  await com("aRascunho", { titulo: "ff A: agendado", destinatarios: "PAIS", escolaId: c.escolaA.id, dataPublicacao: amanha });
  await com("aTurmaA", { titulo: "ff A: turma 3A", destinatarios: "TURMA_ESPECIFICA", turmaId: c.turmaA.id, escolaId: c.escolaA.id });
  await com("aTurmaA2", { titulo: "ff A: turma 3C", destinatarios: "TURMA_ESPECIFICA", turmaId: c.turmaA2.id, escolaId: c.escolaA.id });
  await com("bPais", { titulo: "ff B: aos pais", destinatarios: "PAIS", escolaId: c.escolaB.id });

  // Profissional lotado nas duas escolas, com aula na turma do prof A, na 3C (A) e na 3B (B)
  profC = await prisma.profissionalEducacao.create({ data: { nome: "Prof C ff91", cpf: "00000091003", tipo: "PROFESSOR" } });
  await prisma.escolaProfissional.createMany({
    data: [{ escolaId: c.escolaA.id, profissionalId: profC.id }, { escolaId: c.escolaB.id, profissionalId: profC.id }],
  });
  await prisma.turmaProfessor.createMany({
    data: [c.turmaA.id, c.turmaA2.id, c.turmaB.id].map((turmaId) => ({ turmaId, profissionalId: profC.id, tipo: "AUXILIAR" })),
  });
  disciplinaId = (await prisma.disciplina.create({ data: { nome: "Matemática ff91", codigo: "MAT-FF91", etapaId: c.etapa.id } })).id;

  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("comunicados pela API com o usuário da sessão", () => {
  const VISIVEIS_RESP_A = ["ff A: a todos", "ff A: turma 3A", "ff Rede: aos pais"];
  const meus = (lista: Array<{ id: string; titulo: string }>) => {
    const nossos = new Set(Object.values(ids));
    return lista.filter((x) => nossos.has(x.id)).map((x) => x.titulo).sort();
  };

  it("responsável vê exatamente os publicados das escolas/turmas dos filhos (lista e paginada)", async () => {
    const lista = await req(c.uRespA.email, "GET", "/api/comunicados");
    expect(lista.statusCode).toBe(200);
    expect(meus(itens(lista.json()))).toEqual(VISIVEIS_RESP_A);

    const pag = await req(c.uRespA.email, "GET", "/api/comunicados?page=1&limit=100");
    expect(pag.statusCode).toBe(200);
    expect(meus(pag.json().data)).toEqual(VISIVEIS_RESP_A);
  });

  it("responsável da escola B não vê os da A; detalhe alheio 404, o próprio 200", async () => {
    const lista = await req(c.uRespB.email, "GET", "/api/comunicados");
    expect(meus(itens(lista.json()))).toEqual(["ff B: aos pais", "ff Rede: aos pais"]);
    expect((await req(c.uRespA.email, "GET", `/api/comunicados/${ids.bPais}`)).statusCode).toBe(404);
    expect((await req(c.uRespA.email, "GET", `/api/comunicados/${ids.aTurmaA2}`)).statusCode).toBe(404);
    const proprio = await req(c.uRespA.email, "GET", `/api/comunicados/${ids.aTurmaA}`);
    expect(proprio.statusCode).toBe(200);
    expect(proprio.json().titulo).toBe("ff A: turma 3A");
  });

  it("professor não assina como SEMEC: o autor vem da sessão", async () => {
    const r = await req(c.uProfA.email, "POST", "/api/comunicados", novoComunicado({ escolaId: c.escolaA.id, autorId: c.profB.id }));
    expect(r.statusCode).toBe(201);
    expect(r.json().autorNome).toBe(c.profA.nome);
    const salvo = await prisma.comunicado.findUniqueOrThrow({ where: { id: r.json().id } });
    expect(salvo.autorNome).toBe(c.profA.nome);
    expect(salvo.autorId).toBe(c.profA.id);
  });
});

describe("anexo do comunicado: só https", () => {
  it.each(["javascript:alert(1)", "http://exemplo.gov.br/a.pdf", "data:text/html,oi", "file:///etc/passwd", "ftp://x/a.pdf"])(
    "recusa %s (criação e edição)",
    async (anexoUrl) => {
      const r = await req(c.uAdmin.email, "POST", "/api/comunicados", novoComunicado({ anexoUrl }));
      expect(r.statusCode).toBe(400);
      const put = await req(c.uAdmin.email, "PUT", `/api/comunicados/${ids.redePais}`, { anexoUrl });
      expect(put.statusCode).toBe(400);
    }
  );
  it("aceita https", async () => {
    const r = await req(c.uAdmin.email, "POST", "/api/comunicados", novoComunicado({ anexoUrl: "https://exemplo.gov.br/a.pdf" }));
    expect(r.statusCode).toBe(201);
    expect(r.json().anexoUrl).toBe("https://exemplo.gov.br/a.pdf");
  });
});

describe("escopo nos includes", () => {
  it("estatísticas da escola: professor conta só as próprias turmas/alunos; admin vê tudo", async () => {
    const prof = await req(c.uProfA.email, "GET", `/api/escolas/${c.escolaA.id}/estatisticas`);
    expect(prof.statusCode).toBe(200);
    expect(prof.json()).toMatchObject({ totalTurmas: 1, totalAlunos: 1 });
    const admin = await req(c.uAdmin.email, "GET", `/api/escolas/${c.escolaA.id}/estatisticas`);
    expect(admin.json()).toMatchObject({ totalTurmas: 2, totalAlunos: 2 });
  });

  it("detalhe da escola: professor recebe só as próprias turmas", async () => {
    const r = await req(c.uProfA.email, "GET", `/api/escolas/${c.escolaA.id}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().turmas.map((t: { id: string }) => t.id)).toEqual([c.turmaA.id]);
  });

  it("série: professor não recebe turmas de outras escolas/professores", async () => {
    const r = await req(c.uProfA.email, "GET", `/api/series/${c.serie.id}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().turmas.map((t: { id: string }) => t.id)).toEqual([c.turmaA.id]);
    const admin = await req(c.uAdmin.email, "GET", `/api/series/${c.serie.id}`);
    expect(admin.json().turmas).toHaveLength(3);
  });

  it("profissional: vínculos com escolas/turmas fora do escopo ficam de fora (detalhe e lista)", async () => {
    const r = await req(c.uProfA.email, "GET", `/api/profissionais/${profC.id}`);
    expect(r.statusCode).toBe(200);
    const corpo = r.json();
    expect(corpo.escolas.map((e: { escolaId: string }) => e.escolaId)).toEqual([c.escolaA.id]);
    expect(corpo.turmas.map((t: { turmaId: string }) => t.turmaId)).toEqual([c.turmaA.id]);

    const lista = await req(c.uProfA.email, "GET", "/api/profissionais");
    const doC = itens<{ id: string; turmas: Array<{ turmaId: string }> }>(lista.json()).find((p) => p.id === profC.id);
    expect(doC?.turmas.map((t) => t.turmaId)).toEqual([c.turmaA.id]);

    const admin = await req(c.uAdmin.email, "GET", `/api/profissionais/${profC.id}`);
    expect(admin.json().turmas).toHaveLength(3);
    expect(admin.json().escolas).toHaveLength(2);
  });
});

describe("documentoPath da licença", () => {
  const base = () => ({ profissionalId: c.profA.id, tipo: "LICENCA_MEDICA", dataInicio: "2026-03-02", dataFim: "2026-03-06" });

  it.each([
    "../../etc/passwd",
    "/etc/passwd",
    "licencas/../matriculas/x/y.pdf",
    "matriculas/qualquer/doc.pdf",
    "https://exemplo.gov.br/a.pdf",
    "licencas\\outro\\a.pdf",
  ])("recusa %s", async (documentoPath) => {
    const r = await req(c.uAdmin.email, "POST", "/api/licencas", { ...base(), documentoPath });
    expect(r.statusCode).toBe(400);
  });

  it("recusa chave de OUTRO profissional e chave inexistente; aceita a do próprio que existe", async () => {
    const storage = getStorageDriver();
    const doB = `licencas/${c.profB.id}/atestado-ff91.pdf`;
    const doA = `licencas/${c.profA.id}/atestado-ff91.pdf`;
    await storage.save(doB, Buffer.from("%PDF-ficticio"), "application/pdf");
    await storage.save(doA, Buffer.from("%PDF-ficticio"), "application/pdf");
    try {
      expect((await req(c.uAdmin.email, "POST", "/api/licencas", { ...base(), documentoPath: doB })).statusCode).toBe(400);
      const inexistente = `licencas/${c.profA.id}/nao-existe.pdf`;
      expect((await req(c.uAdmin.email, "POST", "/api/licencas", { ...base(), documentoPath: inexistente })).statusCode).toBe(400);
      const ok = await req(c.uAdmin.email, "POST", "/api/licencas", { ...base(), documentoPath: doA });
      expect(ok.statusCode).toBe(201);
      // Editar para a chave de outro profissional também é recusado
      const put = await req(c.uAdmin.email, "PUT", `/api/licencas/${ok.json().id}`, { documentoPath: doB });
      expect(put.statusCode).toBe(400);
      // ...e mover a licença para outro profissional mantendo o documento do A
      const mover = await req(c.uAdmin.email, "PUT", `/api/licencas/${ok.json().id}`, { profissionalId: c.profB.id });
      expect(mover.statusCode).toBe(400);
    } finally {
      await storage.delete(doA);
      await storage.delete(doB);
    }
  });

  it("sem documento continua funcionando", async () => {
    expect((await req(c.uAdmin.email, "POST", "/api/licencas", base())).statusCode).toBe(201);
  });
});

describe("situação final EM_CURSO", () => {
  it("sem notas: EM_CURSO e mediaFinal null (não 0)", async () => {
    const r = await req(c.uAdmin.email, "GET", `/api/notas/situacao/${c.matA.id}/${c.turmaA.id}/${disciplinaId}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().situacao).toBe("EM_CURSO");
    expect(r.json().mediaFinal).toBeNull();
  });
});

describe("erros de negócio de licenças viram 400 com a mensagem", () => {
  it("editar licença já aprovada → 400 (antes 500 genérico)", async () => {
    const lic = await prisma.licenca.create({
      data: {
        profissionalId: c.profA.id, tipo: "FERIAS", dataInicio: new Date("2026-07-01"), dataFim: new Date("2026-07-10"),
        diasCorridos: 10, status: "APROVADA",
      },
    });
    const r = await req(c.uAdmin.email, "PUT", `/api/licencas/${lic.id}`, { motivo: "ajuste" });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toMatch(/aprovada ou rejeitada/);
    const cancelar = await req(c.uAdmin.email, "DELETE", `/api/licencas/${lic.id}`);
    expect(cancelar.statusCode).toBe(400);
  });
});

describe("parâmetros numéricos validados (400 de validação)", () => {
  it.each([
    "/api/notas?bimestre=abc",
    "/api/notas?bimestre=5",
    "/api/notas?bimestre=0",
    "/api/notas?bimestre=1.5",
    "/api/matriculas?anoLetivo=abc",
    "/api/matriculas?anoLetivo=1999",
    "/api/matriculas/sem-turma?anoLetivo=3000",
    "/api/matriculas/estatisticas",
    "/api/matriculas/estatisticas?anoLetivo=2026x",
    "/api/motoristas/alertas-cnh?dias=0",
    "/api/motoristas/alertas-cnh?dias=99999",
    "/api/motoristas/alertas-cnh?dias=abc",
    "/api/pontos/relatorio/qualquer/13/2026",
    "/api/pontos/relatorio/qualquer/0/2026",
    "/api/pontos/relatorio/qualquer/1/1999",
    "/api/pontos/relatorio/qualquer/abc/2026",
    "/api/licencas/relatorio/qualquer?anoInicio=abc",
    "/api/licencas/relatorio/qualquer?anoInicio=2027&anoFim=2026",
  ])("%s → 400", async (url) => {
    const r = await req(c.uAdmin.email, "GET", url);
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe("VALIDATION");
  });

  it.each([
    "/api/notas?bimestre=2",
    "/api/matriculas?anoLetivo=2026",
    "/api/matriculas/sem-turma?anoLetivo=2026",
    "/api/matriculas/estatisticas?anoLetivo=2026",
    "/api/motoristas/alertas-cnh",
    "/api/motoristas/alertas-cnh?dias=60",
    `/api/licencas/relatorio/__PROF__?anoInicio=2025&anoFim=2026`,
  ])("%s → 200", async (url) => {
    const r = await req(c.uAdmin.email, "GET", url.replace("__PROF__", c.profA.id));
    expect(r.statusCode).toBe(200);
  });
});
