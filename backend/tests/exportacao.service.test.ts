import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { exportacaoEducacensoService } from "../src/services/exportacao-educacenso.service.js";
import { exportacaoPresencaService } from "../src/services/exportacao-presenca.service.js";
import { exportacaoPresencaQuerySchema } from "../src/schemas/exportacao.schemas.js";

let anoLetivo: { id: string; ano: number };
let escola: { id: string };
let turmaPre: { id: string };
let turma3ano: { id: string };
let turmaMulti: { id: string };
let alunaPre: { id: string };
let aluno3b: { id: string };
let alunoSemTurma: { id: string };

describe("Exportadores oficiais (Educacenso + Sistema Presença)", () => {
  beforeAll(async () => {
    // Limpeza em ordem de FK (filhas → pais)
    await prisma.frequencia.deleteMany();
    await prisma.nota.deleteMany();
    await prisma.avaliacao.deleteMany();
    await prisma.turmaProfessor.deleteMany();
    await prisma.matricula.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.serie.deleteMany();
    await prisma.nivelEnsino.deleteMany();
    await prisma.eventoCalendario.deleteMany();
    await prisma.anoLetivo.deleteMany();
    // Quebra o ciclo Escola ↔ diretor antes de remover profissionais
    await prisma.escola.updateMany({ data: { diretorId: null } });
    await prisma.escola.deleteMany();
    await prisma.profissionalEducacao.deleteMany();
    await prisma.etapaEnsino.deleteMany();
    await prisma.tipoEducacao.deleteMany();

    anoLetivo = await prisma.anoLetivo.create({ data: { ano: 2026 } });
    await prisma.eventoCalendario.create({
      data: {
        titulo: "Início do ano letivo",
        tipo: "INICIO_ANO_LETIVO",
        dataInicio: new Date("2026-02-02"),
        escopo: "REDE",
        anoLetivoId: anoLetivo.id,
        escolaId: null,
      },
    });
    await prisma.eventoCalendario.create({
      data: {
        titulo: "Fim do ano letivo",
        tipo: "FIM_ANO_LETIVO",
        dataInicio: new Date("2026-12-11"),
        escopo: "REDE",
        anoLetivoId: anoLetivo.id,
        escolaId: null,
      },
    });

    const tipo = await prisma.tipoEducacao.create({
      data: { nome: "Educação Regular Export" },
    });
    const etapa = await prisma.etapaEnsino.create({
      data: { nome: "Educação Básica Export", tipoEducacaoId: tipo.id },
    });
    const nivel = await prisma.nivelEnsino.create({
      data: { nome: "Nível Export", etapaId: etapa.id },
    });
    const seriePre = await prisma.serie.create({
      data: { nome: "Pré I (4 anos)", nivelId: nivel.id },
    });
    const serie3ano = await prisma.serie.create({
      data: { nome: "3º Ano", nivelId: nivel.id },
    });
    const serieMulti = await prisma.serie.create({
      data: { nome: "Multisseriada", nivelId: nivel.id },
    });

    const diretora = await prisma.profissionalEducacao.create({
      data: {
        nome: "Diretora Teste",
        cpf: "11122233344",
        tipo: "DIRETOR",
        regimeContratacao: "EFETIVO",
      },
    });
    const docente = await prisma.profissionalEducacao.create({
      data: { nome: "Prof Teste", cpf: "55566677788", tipo: "PROFESSOR" },
    });

    escola = await prisma.escola.create({
      data: {
        nome: "Escola Export",
        codigo: "EXP-01",
        diretorId: diretora.id,
        // Json nativo: objeto direto, sem JSON.stringify
        dadosCenso: {
          codigoEscola: "12345678",
          situacaoFuncionamento: "Em atividade",
          localizacao: "Urbana",
          dependenciaAdministrativa: "Municipal",
        },
      },
    });

    turmaPre = await prisma.turma.create({
      data: {
        nome: "Pré A",
        turno: "MATUTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: seriePre.id,
      },
    });
    turma3ano = await prisma.turma.create({
      data: {
        nome: "3º Ano A",
        turno: "VESPERTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serie3ano.id,
      },
    });
    turmaMulti = await prisma.turma.create({
      data: {
        nome: "Multi A",
        turno: "MATUTINO",
        anoLetivo: 2026,
        escolaId: escola.id,
        serieId: serieMulti.id,
      },
    });
    await prisma.turmaProfessor.create({
      data: {
        turmaId: turma3ano.id,
        profissionalId: docente.id,
        tipo: "PROFESSOR",
        disciplina: "Matemática",
      },
    });

    const baseMatricula = {
      anoLetivo: 2026,
      status: "ATIVA",
      sexo: "M",
      nomeResponsavel: "Responsável Export",
      escolaId: escola.id,
      etapaId: etapa.id,
    };
    alunaPre = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026001",
        nomeAluno: "Ana Pre",
        dataNascimento: new Date("2021-03-01"), // 5 anos em 31/07/2026
        sexo: "F",
        nisAluno: "12345678901",
        turmaId: turmaPre.id,
      },
    });
    await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026002",
        nomeAluno: "Bruno Terceiro",
        dataNascimento: new Date("2016-01-15"), // 10 anos
        turmaId: turma3ano.id,
      },
    });
    aluno3b = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026003",
        nomeAluno: "Carlos Terceiro",
        dataNascimento: new Date("2016-06-01"),
        turmaId: turma3ano.id,
      },
    });
    const alunoAdulto = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026004",
        nomeAluno: "Adulto Fora Faixa",
        dataNascimento: new Date("2000-01-01"), // fora da faixa etária
        turmaId: turma3ano.id,
      },
    });
    alunoSemTurma = await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026005",
        nomeAluno: "Sem Turma Teste",
        dataNascimento: new Date("2016-02-02"),
        turmaId: null,
      },
    });
    await prisma.matricula.create({
      data: {
        ...baseMatricula,
        numeroMatricula: "EXP2026006",
        nomeAluno: "Diego Sem Registro",
        dataNascimento: new Date("2017-01-01"), // 9 anos, sem frequência no mês
        turmaId: turma3ano.id,
      },
    });
    const aluno3aId = (await prisma.matricula.findUnique({
      where: { numeroMatricula: "EXP2026002" },
    }))!.id;

    // Frequências de julho/2026 (10 dias letivos: 01..10)
    const registros: Array<{
      matriculaId: string;
      turmaId: string;
      data: Date;
      status: string;
    }> = [];
    for (let dia = 1; dia <= 10; dia++) {
      const data = new Date(Date.UTC(2026, 6, dia));
      // alunaPre: 5 PRESENTE + 5 FALTA → 50% < 60 (listada)
      registros.push({
        matriculaId: alunaPre.id,
        turmaId: turmaPre.id,
        data,
        status: dia <= 5 ? "PRESENTE" : "FALTA",
      });
      // aluno3a: 8 PRESENTE + 2 FALTA → 80% ≥ 75 (fora)
      registros.push({
        matriculaId: aluno3aId,
        turmaId: turma3ano.id,
        data,
        status: dia <= 8 ? "PRESENTE" : "FALTA",
      });
      // aluno3b: 6 PRESENTE + 3 FALTA + 1 JUSTIFICADA → 60% < 75 (listado)
      registros.push({
        matriculaId: aluno3b.id,
        turmaId: turma3ano.id,
        data,
        status: dia <= 6 ? "PRESENTE" : dia <= 9 ? "FALTA" : "JUSTIFICADA",
      });
      // alunoAdulto: 10 FALTA → 0%, mas fora da faixa etária
      registros.push({
        matriculaId: alunoAdulto.id,
        turmaId: turma3ano.id,
        data,
        status: "FALTA",
      });
    }
    await prisma.frequencia.createMany({ data: registros });
  });

  describe("gerarEducacenso", () => {
    it("gera o registro 00 da escola com 14 campos e dados do calendário", async () => {
      const resultado = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });
      const linhas = resultado.conteudo.split("\r\n").filter(Boolean);

      expect(linhas[0]).toMatch(
        /^00\|12345678\|1\|02\/02\/2026\|11\/12\/2026\|Escola Export\|/
      );
      expect(linhas[0].split("|")).toHaveLength(14);
    });

    it("emite as contagens corretas por tipo de registro e termina em 99|", async () => {
      const resultado = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });
      const linhas = resultado.conteudo.split("\r\n").filter(Boolean);

      const contar = (prefixo: string) =>
        linhas.filter((l) => l.startsWith(`${prefixo}|`)).length;

      expect(contar("20")).toBe(3);
      expect(contar("60")).toBe(6); // todas as ATIVA, inclusive sem turma
      expect(contar("40")).toBe(1);
      expect(contar("50")).toBe(1);
      // 6 alunos + diretora + docente (dedupe por pessoa por escola)
      expect(contar("30")).toBe(8);
      expect(linhas[linhas.length - 1]).toBe("99|");
    });

    it("mapeia turno/etapa no registro 20 e PCD/etapa/NIS nos registros 30/60", async () => {
      const resultado = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });
      const linhas = resultado.conteudo.split("\r\n").filter(Boolean);

      const linha20Pre = linhas.find((l) =>
        l.startsWith(`20|12345678|${turmaPre.id}|`)
      );
      expect(linha20Pre).toBeDefined();
      const campos20 = linha20Pre!.split("|");
      expect(campos20[4]).toBe("1"); // MATUTINO
      expect(campos20[6]).toBe("2"); // Pré I → etapa 2

      const linha60Ana = linhas.find((l) =>
        l.startsWith(`60|12345678|${alunaPre.id}|`)
      );
      expect(linha60Ana).toBeDefined();
      const campos60 = linha60Ana!.split("|");
      expect(campos60[5]).toBe("2"); // etapa da série da turma
      expect(campos60[6]).toBe("0"); // PCD

      const linha30Ana = linhas.find((l) =>
        l.startsWith(`30|12345678|${alunaPre.id}|`)
      );
      expect(linha30Ana).toBeDefined();
      expect(linha30Ana!.split("|")[11]).toBe("12345678901"); // NIS
    });

    it("relata pendências ERRO para matrícula sem turma e série sem mapeamento", async () => {
      const resultado = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });

      const semTurma = resultado.pendencias.find(
        (p) =>
          p.registro === "60" &&
          p.campo === "codigoTurma" &&
          p.entidadeId === alunoSemTurma.id
      );
      expect(semTurma).toBeDefined();
      expect(semTurma!.nivel).toBe("ERRO");

      const serieSemMapa = resultado.pendencias.find(
        (p) =>
          p.registro === "20" &&
          p.campo === "etapaEducacenso" &&
          p.entidadeId === turmaMulti.id
      );
      expect(serieSemMapa).toBeDefined();
      expect(serieSemMapa!.nivel).toBe("ERRO");

      // Nenhum aluno da fixture tem CPF → AVISO de CPF vazio no registro 30
      const avisoCpf = resultado.pendencias.filter(
        (p) => p.registro === "30" && p.campo === "cpf" && p.nivel === "AVISO"
      );
      expect(avisoCpf.length).toBeGreaterThanOrEqual(6);

      expect(resultado.resumo.pendenciasPorNivel.ERRO).toBeGreaterThanOrEqual(2);
      expect(resultado.resumo.totalPendencias).toBe(
        resultado.pendencias.length
      );
    });

    it("aponta cada pendência para uma linha do TXT com o mesmo tipo de registro", async () => {
      const resultado = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });
      const linhas = resultado.conteudo.split("\r\n").filter(Boolean);

      for (const pendencia of resultado.pendencias) {
        const linha = linhas[pendencia.linha - 1];
        expect(linha).toBeDefined();
        expect(linha.startsWith(`${pendencia.registro}|`)).toBe(true);
      }
    });

    it("nomeia o arquivo por rede ou por código INEP da escola", async () => {
      const rede = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
      });
      expect(rede.nomeArquivo).toBe("educacenso_2026_rede.txt");

      const porEscola = await exportacaoEducacensoService.gerarEducacenso({
        anoLetivoId: anoLetivo.id,
        escolaId: escola.id,
      });
      expect(porEscola.nomeArquivo).toBe("educacenso_2026_12345678.txt");
      expect(porEscola.resumo.totalEscolas).toBe(1);
    });

    it("rejeita ano letivo e escola inexistentes", async () => {
      await expect(
        exportacaoEducacensoService.gerarEducacenso({
          anoLetivoId: "ano-inexistente",
        })
      ).rejects.toThrow("Ano letivo não encontrado");

      await expect(
        exportacaoEducacensoService.gerarEducacenso({
          anoLetivoId: anoLetivo.id,
          escolaId: "escola-inexistente",
        })
      ).rejects.toThrow("Escola não encontrada");
    });
  });

  describe("gerarSistemaPresenca", () => {
    it("lista apenas alunos abaixo do limiar da faixa etária", async () => {
      const resultado = await exportacaoPresencaService.gerarSistemaPresenca({
        anoLetivoId: anoLetivo.id,
        mes: 7,
      });

      expect(resultado.linhas).toHaveLength(2);
      const nomes = resultado.linhas.map((l) => l.nomeAluno);
      expect(nomes).toContain("Ana Pre");
      expect(nomes).toContain("Carlos Terceiro");
      expect(nomes).not.toContain("Bruno Terceiro"); // 80% ≥ 75
      expect(nomes).not.toContain("Adulto Fora Faixa"); // fora da faixa etária
    });

    it("aplica limiar 60% na pré-escola (4–5 anos) com idade no último dia do mês", async () => {
      const resultado = await exportacaoPresencaService.gerarSistemaPresenca({
        anoLetivoId: anoLetivo.id,
        mes: 7,
      });
      const ana = resultado.linhas.find((l) => l.nomeAluno === "Ana Pre")!;

      expect(ana.faixaEtaria).toBe("PRE_ESCOLA_4_5");
      expect(ana.limiarFrequencia).toBe(60);
      expect(ana.percentualFrequencia).toBe(50);
      expect(ana.idade).toBe(5);
      expect(ana.periodo).toBe("07/2026");
    });

    it("não conta JUSTIFICADA como presença, mas emite em coluna própria", async () => {
      const resultado = await exportacaoPresencaService.gerarSistemaPresenca({
        anoLetivoId: anoLetivo.id,
        mes: 7,
      });
      const carlos = resultado.linhas.find(
        (l) => l.nomeAluno === "Carlos Terceiro"
      )!;

      expect(carlos.limiarFrequencia).toBe(75);
      expect(carlos.percentualFrequencia).toBe(60); // 6/10 — justificada NÃO conta
      expect(carlos.presencas).toBe(6);
      expect(carlos.faltas).toBe(3);
      expect(carlos.faltasJustificadas).toBe(1);
      expect(carlos.totalAulas).toBe(10);
    });

    it("contabiliza alunos sem registro no mês e fora da faixa etária no resumo", async () => {
      const resultado = await exportacaoPresencaService.gerarSistemaPresenca({
        anoLetivoId: anoLetivo.id,
        mes: 7,
      });

      expect(resultado.resumo.alunosSemRegistro).toBe(1); // Diego
      expect(resultado.resumo.alunosForaFaixaEtaria).toBe(1); // Adulto
      expect(resultado.resumo.totalBaixaFrequencia).toBe(2);
      expect(resultado.resumo.ano).toBe(2026);
      expect(resultado.resumo.mes).toBe(7);
    });

    it("gera CSV com BOM, header oficial e NIS quando cadastrado", async () => {
      const resultado = await exportacaoPresencaService.gerarSistemaPresenca({
        anoLetivoId: anoLetivo.id,
        mes: 7,
      });

      expect(resultado.conteudo.startsWith("\uFEFF")).toBe(true);
      const linhasCsv = resultado.conteudo
        .replace("\uFEFF", "")
        .split("\r\n")
        .filter(Boolean);
      expect(linhasCsv[0]).toBe(
        "codigo_inep_escola;nome_escola;nome_aluno;nis_aluno;data_nascimento;serie;turma;turno;idade;faixa_etaria;limiar_frequencia;total_aulas;presencas;faltas;faltas_justificadas;percentual_frequencia;periodo"
      );

      const linhaAna = linhasCsv.find((l) => l.includes("Ana Pre"))!;
      expect(linhaAna).toContain(";12345678901;");
      expect(linhaAna.startsWith("12345678;")).toBe(true);

      const linhaCarlos = linhasCsv.find((l) => l.includes("Carlos Terceiro"))!;
      expect(linhaCarlos.split(";")[3]).toBe(""); // NIS vazio

      expect(resultado.nomeArquivo).toBe("sistema-presenca_2026-07_rede.csv");
    });

    it("rejeita ano letivo inexistente e mês fora de 1..12 no schema", async () => {
      await expect(
        exportacaoPresencaService.gerarSistemaPresenca({
          anoLetivoId: "ano-inexistente",
          mes: 7,
        })
      ).rejects.toThrow("Ano letivo não encontrado");

      expect(() =>
        exportacaoPresencaQuerySchema.parse({ anoLetivoId: "x", mes: 13 })
      ).toThrow();
      expect(() =>
        exportacaoPresencaQuerySchema.parse({ anoLetivoId: "x", mes: 0 })
      ).toThrow();
    });
  });
});
