import { describe, it, expect } from "vitest";
import { autorizar } from "../src/lib/rbac.js";

// Testes da função pura de autorização (tabelas em src/lib/rbac.ts).
// A checagem de propriedade do DIRETOR (consulta o banco) fica fora — testada ao vivo (F3).

const u = (role: string, id = "user-1") => ({ id, role });

describe("autorizar — leituras", () => {
  it("GET comum é liberado a qualquer autenticado", () => {
    expect(autorizar("/api/escolas", "GET", u("USER"))).toBe("OK");
    expect(autorizar("/api/turmas/t1", "GET", u("PROFESSOR"))).toBe("OK");
  });

  it("leituras restritas de RH negam PROFESSOR/USER", () => {
    expect(autorizar("/api/licencas", "GET", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/pontos", "GET", u("USER"))).toBe("NEGADO");
    expect(autorizar("/api/licencas", "GET", u("SECRETARIA"))).toBe("OK");
  });

  it("documentos da matrícula não são lidos por PROFESSOR (LGPD)", () => {
    expect(autorizar("/api/matriculas/m1/documentos", "GET", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/matriculas/m1/documentos", "GET", u("DIRETOR"))).toBe("OK");
  });

  it("resumos de portal seguem o papel da tela", () => {
    expect(autorizar("/api/portal/professor/resumo", "GET", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/portal/professor/resumo", "GET", u("USER"))).toBe("NEGADO");
    expect(autorizar("/api/portal/diretor/resumo", "GET", u("DIRETOR"))).toBe("OK");
    expect(autorizar("/api/portal/diretor/resumo", "GET", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/portal/semec/resumo", "GET", u("SEMEC"))).toBe("OK");
    expect(autorizar("/api/portal/semec/resumo", "GET", u("DIRETOR"))).toBe("NEGADO");
  });

  it("exportadores oficiais restritos à equipe operacional (CPF/NIS)", () => {
    expect(autorizar("/api/exportacao/educacenso", "GET", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/exportacao/sistema-presenca", "GET", u("SECRETARIA"))).toBe("OK");
  });
});

describe("autorizar — allowlist do RESPONSAVEL", () => {
  it("lê apenas o próprio portal, comunicados e calendário", () => {
    expect(autorizar("/api/portal/meu/alunos", "GET", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/portal/meu/alunos/m1/boletim", "GET", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/comunicados", "GET", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/calendario/anos-letivos", "GET", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/auth/me", "GET", u("RESPONSAVEL"))).toBe("OK");
  });

  it("nega todo o resto (matrículas, notas, frequência, escolas)", () => {
    expect(autorizar("/api/matriculas", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/notas", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/frequencia", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/escolas", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/portal/professor/resumo", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
  });

  it("notificações só as próprias", () => {
    expect(autorizar("/api/notificacoes/usuario/user-1", "GET", u("RESPONSAVEL", "user-1"))).toBe("OK");
    expect(autorizar("/api/notificacoes/usuario/outro", "GET", u("RESPONSAVEL", "user-1"))).toBe("NEGADO");
  });

  it("pode registrar recibos de leitura, mas não outras escritas", () => {
    expect(autorizar("/api/comunicados/c1/confirmar", "POST", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/comunicados/c1/marcar-lido", "POST", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/notificacoes/n1/marcar-lida", "POST", u("RESPONSAVEL"))).toBe("OK");
    expect(autorizar("/api/matriculas", "POST", u("RESPONSAVEL"))).toBe("NEGADO");
    expect(autorizar("/api/comunicados", "POST", u("RESPONSAVEL"))).toBe("NEGADO");
  });
});

describe("autorizar — escritas por módulo", () => {
  it("acessos do portal: OPERACAO cria e revoga (incl. DELETE)", () => {
    expect(autorizar("/api/matriculas/m1/acessos", "POST", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/matriculas/m1/acessos/v1", "DELETE", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/matriculas/m1/acessos", "POST", u("PROFESSOR"))).toBe("NEGADO");
  });

  it("documentos da matrícula: upload OPERACAO; expurgo (DELETE da coleção) GESTAO", () => {
    expect(autorizar("/api/matriculas/m1/documentos", "POST", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/matriculas/m1/documentos/d1", "DELETE", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/matriculas/m1/documentos", "DELETE", u("SECRETARIA"))).toBe("NEGADO");
    expect(autorizar("/api/matriculas/m1/documentos", "DELETE", u("ADMIN"))).toBe("OK");
  });

  it("módulo 6: escrita OPERACAO; DELETE de movimentação só GESTAO", () => {
    expect(autorizar("/api/cardapios", "POST", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/estoque/itens", "POST", u("DIRETOR"))).toBe("OK");
    expect(autorizar("/api/refeicoes", "POST", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/estoque/movimentacoes/mv1", "DELETE", u("DIRETOR"))).toBe("NEGADO");
    expect(autorizar("/api/estoque/movimentacoes/mv1", "DELETE", u("ADMIN"))).toBe("OK");
  });

  it("módulo 7: escrita OPERACAO", () => {
    expect(autorizar("/api/veiculos", "POST", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/rotas-transporte/r1/alunos", "POST", u("COORDENADOR"))).toBe("OK");
    expect(autorizar("/api/motoristas", "POST", u("PROFESSOR"))).toBe("NEGADO");
    // DELETE dentro do módulo segue o papel do módulo (regra antes do DELETE genérico)
    expect(autorizar("/api/veiculos/v1", "DELETE", u("SECRETARIA"))).toBe("OK");
  });

  it("módulo 8: escrita PEDAGOGICO (professores participam)", () => {
    expect(autorizar("/api/lideres-turma", "POST", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/gremios", "POST", u("COORDENADOR"))).toBe("OK");
    expect(autorizar("/api/colegiados", "POST", u("USER"))).toBe("NEGADO");
    expect(autorizar("/api/reunioes-democraticas/r1", "DELETE", u("PROFESSOR"))).toBe("OK");
  });

  it("regras legadas preservadas: estrutura GESTAO, DELETE genérico GESTAO, fallback OPERACAO", () => {
    expect(autorizar("/api/series", "POST", u("DIRETOR"))).toBe("NEGADO");
    expect(autorizar("/api/series", "POST", u("ADMIN"))).toBe("OK");
    expect(autorizar("/api/turmas/t1", "DELETE", u("DIRETOR"))).toBe("NEGADO");
    expect(autorizar("/api/turmas/t1", "DELETE", u("SEMEC"))).toBe("OK");
    expect(autorizar("/api/turmas", "POST", u("SECRETARIA"))).toBe("OK");
    expect(autorizar("/api/turmas", "POST", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/frequencia", "POST", u("PROFESSOR"))).toBe("OK");
  });
});

describe("autorizar — planejamento pedagógico (Módulo 2)", () => {
  it("professor escreve planos e atividades (inclusive DELETE, autoria no service), não conteúdos nem revisão", () => {
    expect(autorizar("/api/planejamento/planos", "POST", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/planos/p1", "DELETE", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/planos/p1/enviar", "POST", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/atividades/a1", "DELETE", u("PROFESSOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/planos/p1/revisar", "POST", u("PROFESSOR"))).toBe("NEGADO");
    expect(autorizar("/api/planejamento/conteudos", "POST", u("PROFESSOR"))).toBe("NEGADO");
  });

  it("coordenação revisa e mantém conteúdos; secretaria e externos ficam fora", () => {
    expect(autorizar("/api/planejamento/planos/p1/revisar", "POST", u("COORDENADOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/conteudos/c1", "DELETE", u("DIRETOR"))).toBe("OK");
    expect(autorizar("/api/planejamento/planos", "POST", u("SECRETARIA"))).toBe("NEGADO");
    expect(autorizar("/api/planejamento/planos", "GET", u("SECRETARIA"))).toBe("NEGADO");
    expect(autorizar("/api/planejamento/planos", "GET", u("USER"))).toBe("NEGADO");
    expect(autorizar("/api/planejamento/planos", "GET", u("RESPONSAVEL"))).toBe("NEGADO");
  });
});
