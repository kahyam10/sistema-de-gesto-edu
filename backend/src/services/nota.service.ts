import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import { CreateNotaInput, LancarNotasTurmaInput, UpdateNotaInput } from "../schemas/index.js";
import { frequenciaService } from "./frequencia.service.js";

interface BoletimDisciplina {
  disciplinaId: string;
  disciplinaNome: string;
  disciplinaCodigo: string;
  bimestres: Array<{
    bimestre: number;
    media: number | null;
    avaliacoes: Array<{
      id: string;
      nome: string;
      tipo: string;
      peso: number;
      valorMaximo: number;
      nota: number | null;
    }>;
  }>;
  mediaFinal: number | null;
  situacao: "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";
}

interface Boletim {
  matricula: {
    id: string;
    nomeAluno: string;
    numeroMatricula: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
  };
  disciplinas: BoletimDisciplina[];
  frequencia: {
    percentualPresenca: number;
    totalAulas: number;
    presencas: number;
    faltas: number;
    abaixoDoLimite: boolean;
  };
  situacaoGeral: "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO";
}

export class NotaService {
  async findById(id: string) {
    return prisma.nota.findUnique({
      where: { id },
      include: {
        avaliacao: {
          include: {
            turma: {
              select: { id: true, nome: true, serie: { select: { nome: true } } },
            },
            disciplina: { select: { id: true, nome: true, codigo: true } },
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  async findAll(filters?: {
    turmaId?: string;
    disciplina?: string;
    matriculaId?: string;
    bimestre?: number;
  }) {
    const where: any = {};

    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplina) where.disciplina = filters.disciplina;
    if (filters?.matriculaId) where.matriculaId = filters.matriculaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    return prisma.nota.findMany({
      where,
      include: {
        avaliacao: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            peso: true,
            valorMaximo: true,
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
      orderBy: [
        { disciplina: "asc" },
        { bimestre: "asc" },
        { createdAt: "asc" },
      ],
    });
  }

  async findAllPaginated(
    filters: {
      turmaId?: string;
      disciplina?: string;
      matriculaId?: string;
      bimestre?: number;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: any = {};

    if (filters?.turmaId) where.turmaId = filters.turmaId;
    if (filters?.disciplina) where.disciplina = filters.disciplina;
    if (filters?.matriculaId) where.matriculaId = filters.matriculaId;
    if (filters?.bimestre) where.bimestre = filters.bimestre;

    const include = {
      avaliacao: {
        select: {
          id: true,
          nome: true,
          tipo: true,
          peso: true,
          valorMaximo: true,
        },
      },
      matricula: {
        select: { id: true, nomeAluno: true, numeroMatricula: true },
      },
    };

    const [data, total] = await Promise.all([
      prisma.nota.findMany({
        where,
        include,
        orderBy: [
          { disciplina: "asc" },
          { bimestre: "asc" },
          { createdAt: "asc" },
        ],
        skip,
        take: pagination.limit,
      }),
      prisma.nota.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async create(data: CreateNotaInput) {
    // Verifica se matrícula existe e pertence à turma
    const matricula = await prisma.matricula.findUnique({
      where: { id: data.matriculaId },
      include: { turma: true },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    if (matricula.turmaId !== data.turmaId) {
      throw new Error("Matrícula não pertence à turma especificada");
    }

    // Cria a nota
    return prisma.nota.create({
      data: {
        matriculaId: data.matriculaId,
        turmaId: data.turmaId,
        disciplina: data.disciplina,
        bimestre: data.bimestre,
        avaliacaoId: data.avaliacaoId ?? undefined,
        valor: data.valor,
        observacao: data.observacao,
      },
      include: {
        avaliacao: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            peso: true,
            valorMaximo: true,
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  /**
   * Lança notas em lote para uma avaliação.
   * Faz upsert: cria se não existe, atualiza se já existe.
   */
  async lancarNotasTurma(data: LancarNotasTurmaInput) {
    // Verifica se avaliação existe
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: data.avaliacaoId },
      include: {
        turma: { include: { matriculas: { where: { status: "ATIVA" } } } },
        disciplina: true,
      },
    });

    if (!avaliacao) {
      throw new NotFoundError("NF_010");
    }

    // Valida que todas as matrículas pertencem à turma
    const matriculasIds = avaliacao.turma.matriculas.map((m) => m.id);
    for (const nota of data.notas) {
      if (!matriculasIds.includes(nota.matriculaId)) {
        throw new Error(
          `Matrícula ${nota.matriculaId} não pertence à turma desta avaliação`
        );
      }
      if (nota.valor > avaliacao.valorMaximo) {
        throw new Error(
          `Nota ${nota.valor} excede o valor máximo ${avaliacao.valorMaximo}`
        );
      }
    }

    // Upsert em transação
    const notas = await prisma.$transaction(
      data.notas.map((nota) =>
        prisma.nota.upsert({
          where: {
            avaliacaoId_matriculaId: {
              avaliacaoId: data.avaliacaoId,
              matriculaId: nota.matriculaId,
            },
          },
          update: {
            valor: nota.valor,
            observacao: nota.observacao,
          },
          create: {
            avaliacaoId: data.avaliacaoId,
            matriculaId: nota.matriculaId,
            turmaId: avaliacao.turmaId,
            disciplina: avaliacao.disciplina.nome,
            bimestre: avaliacao.bimestre,
            valor: nota.valor,
            observacao: nota.observacao,
          },
          include: {
            matricula: {
              select: { id: true, nomeAluno: true, numeroMatricula: true },
            },
          },
        })
      )
    );

    return {
      message: `Notas lançadas para ${notas.length} aluno(s)`,
      notas,
    };
  }

  async update(id: string, data: UpdateNotaInput) {
    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) {
      throw new NotFoundError("NF_011");
    }

    if (data.valor !== undefined && nota.avaliacaoId) {
      const avaliacao = await prisma.avaliacao.findUnique({
        where: { id: nota.avaliacaoId },
      });
      if (avaliacao && data.valor > avaliacao.valorMaximo) {
        throw new Error(
          `Nota ${data.valor} excede o valor máximo ${avaliacao.valorMaximo}`
        );
      }
    }

    return prisma.nota.update({
      where: { id },
      data,
      include: {
        avaliacao: {
          include: {
            disciplina: { select: { id: true, nome: true } },
          },
        },
        matricula: {
          select: { id: true, nomeAluno: true, numeroMatricula: true },
        },
      },
    });
  }

  async delete(id: string) {
    const nota = await prisma.nota.findUnique({ where: { id } });
    if (!nota) {
      throw new NotFoundError("NF_011");
    }
    return prisma.nota.delete({ where: { id } });
  }

  /**
   * Calcula média ponderada de um aluno em uma disciplina/turma/bimestre.
   * Fórmula: sum(nota * peso) / sum(peso)
   */
  async calcularMedia(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string,
    bimestre: number
  ): Promise<number | null> {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { turmaId, disciplinaId, bimestre },
      include: {
        notas: {
          where: { matriculaId },
        },
      },
    });

    if (avaliacoes.length === 0) return null;

    let somaPonderada = 0;
    let somaPesos = 0;
    let temNota = false;

    for (const avaliacao of avaliacoes) {
      const nota = avaliacao.notas[0];
      if (nota) {
        somaPonderada += nota.valor * avaliacao.peso;
        somaPesos += avaliacao.peso;
        temNota = true;
      }
    }

    if (!temNota || somaPesos === 0) return null;

    return Math.round((somaPonderada / somaPesos) * 100) / 100;
  }

  /**
   * Calcula média final (média dos 4 bimestres).
   */
  async calcularMediaFinal(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string
  ): Promise<number | null> {
    const medias: number[] = [];

    for (let bim = 1; bim <= 4; bim++) {
      const media = await this.calcularMedia(
        matriculaId,
        turmaId,
        disciplinaId,
        bim
      );
      if (media !== null) {
        medias.push(media);
      }
    }

    if (medias.length === 0) return null;

    const soma = medias.reduce((acc, m) => acc + m, 0);
    return Math.round((soma / medias.length) * 100) / 100;
  }

  /**
   * Determina situação do aluno em uma disciplina.
   */
  private determinaSituacao(
    mediaFinal: number | null,
    bimestresComNota: number,
    frequenciaPercentual: number
  ): "APROVADO" | "RECUPERACAO" | "REPROVADO" | "EM_CURSO" {
    // Se nem todos os bimestres têm nota, está em curso
    if (bimestresComNota < 4) return "EM_CURSO";
    if (mediaFinal === null) return "EM_CURSO";

    // Reprovado por frequência
    if (frequenciaPercentual < 75) return "REPROVADO";

    // Aprovado
    if (mediaFinal >= 6.0) return "APROVADO";

    // Recuperação
    if (mediaFinal >= 3.0) return "RECUPERACAO";

    // Reprovado por nota
    return "REPROVADO";
  }

  /**
   * Gera boletim completo de um aluno.
   */
  async getBoletim(matriculaId: string, turmaId?: string): Promise<Boletim> {
    // Busca matrícula
    const matricula = await prisma.matricula.findUnique({
      where: { id: matriculaId },
      include: {
        turma: {
          include: { serie: { select: { nome: true } } },
        },
        escola: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true } },
      },
    });

    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    const turmaEfetiva = turmaId || matricula.turmaId;
    if (!turmaEfetiva) {
      throw new Error("Aluno não está vinculado a uma turma");
    }

    // Busca turma com série (hierarquia atual: Serie → Nível → Etapa)
    const turma = await prisma.turma.findUnique({
      where: { id: turmaEfetiva },
      include: {
        serie: {
          select: {
            nome: true,
            nivel: { select: { etapaId: true } },
          },
        },
      },
    });

    if (!turma) {
      throw new NotFoundError("NF_005");
    }

    // Busca disciplinas da etapa
    const disciplinas = await prisma.disciplina.findMany({
      where: { etapaId: turma.serie.nivel.etapaId, ativo: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });

    // Busca TODAS as avaliações da turma (com a nota do aluno) de uma vez
    // e agrupa em memória — evita o N+1 de disciplina × bimestre.
    const todasAvaliacoes = await prisma.avaliacao.findMany({
      where: { turmaId: turmaEfetiva },
      include: {
        notas: { where: { matriculaId } },
      },
      orderBy: { data: "asc" },
    });

    const porDisciplinaBimestre = new Map<string, typeof todasAvaliacoes>();
    for (const av of todasAvaliacoes) {
      const chave = `${av.disciplinaId}:${av.bimestre}`;
      const lista = porDisciplinaBimestre.get(chave);
      if (lista) lista.push(av);
      else porDisciplinaBimestre.set(chave, [av]);
    }

    const mediaDe = (avaliacoes: typeof todasAvaliacoes): number | null => {
      if (avaliacoes.length === 0) return null;
      let somaPonderada = 0;
      let somaPesos = 0;
      let temNota = false;
      for (const avaliacao of avaliacoes) {
        const nota = avaliacao.notas[0];
        if (nota) {
          somaPonderada += nota.valor * avaliacao.peso;
          somaPesos += avaliacao.peso;
          temNota = true;
        }
      }
      if (!temNota || somaPesos === 0) return null;
      return Math.round((somaPonderada / somaPesos) * 100) / 100;
    };

    // Frequência geral (uma única vez, usada em todas as disciplinas)
    const frequencia = await frequenciaService.calcularEstatisticas(
      matriculaId,
      turmaEfetiva
    );

    const boletimDisciplinas: BoletimDisciplina[] = [];

    for (const disciplina of disciplinas) {
      const bimestres: BoletimDisciplina["bimestres"] = [];
      const medias: number[] = [];
      let bimestresComNota = 0;

      for (let bim = 1; bim <= 4; bim++) {
        const avaliacoes =
          porDisciplinaBimestre.get(`${disciplina.id}:${bim}`) ?? [];

        const avaliacoesComNotas = avaliacoes.map((av) => ({
          id: av.id,
          nome: av.nome,
          tipo: av.tipo,
          peso: av.peso,
          valorMaximo: av.valorMaximo,
          nota: av.notas[0]?.valor ?? null,
        }));

        const media = mediaDe(avaliacoes);
        if (media !== null) {
          bimestresComNota++;
          medias.push(media);
        }

        bimestres.push({
          bimestre: bim,
          media,
          avaliacoes: avaliacoesComNotas,
        });
      }

      const mediaFinal =
        medias.length === 0
          ? null
          : Math.round(
              (medias.reduce((acc, m) => acc + m, 0) / medias.length) * 100
            ) / 100;

      const situacao = this.determinaSituacao(
        mediaFinal,
        bimestresComNota,
        frequencia.percentualPresenca
      );

      boletimDisciplinas.push({
        disciplinaId: disciplina.id,
        disciplinaNome: disciplina.nome,
        disciplinaCodigo: disciplina.codigo,
        bimestres,
        mediaFinal,
        situacao,
      });
    }

    // Situação geral: reprovado se qualquer disciplina reprovada
    let situacaoGeral: Boletim["situacaoGeral"] = "APROVADO";
    const situacoes = boletimDisciplinas.map((d) => d.situacao);

    if (situacoes.some((s) => s === "EM_CURSO")) {
      situacaoGeral = "EM_CURSO";
    } else if (situacoes.some((s) => s === "REPROVADO")) {
      situacaoGeral = "REPROVADO";
    } else if (situacoes.some((s) => s === "RECUPERACAO")) {
      situacaoGeral = "RECUPERACAO";
    }

    return {
      matricula: {
        id: matricula.id,
        nomeAluno: matricula.nomeAluno,
        numeroMatricula: matricula.numeroMatricula,
      },
      turma: {
        id: turma.id,
        nome: turma.nome,
        serie: turma.serie.nome,
      },
      disciplinas: boletimDisciplinas,
      frequencia: {
        percentualPresenca: frequencia.percentualPresenca,
        totalAulas: frequencia.totalAulas,
        presencas: frequencia.presencas,
        faltas: frequencia.faltas + frequencia.faltasJustificadas,
        abaixoDoLimite: frequencia.abaixoDoLimite,
      },
      situacaoGeral,
    };
  }

  /**
   * Retorna situação final em uma disciplina específica.
   */
  async getSituacaoFinal(
    matriculaId: string,
    turmaId: string,
    disciplinaId: string
  ) {
    const mediaFinal = await this.calcularMediaFinal(
      matriculaId,
      turmaId,
      disciplinaId
    );

    // Conta bimestres com nota
    let bimestresComNota = 0;
    for (let bim = 1; bim <= 4; bim++) {
      const media = await this.calcularMedia(
        matriculaId,
        turmaId,
        disciplinaId,
        bim
      );
      if (media !== null) bimestresComNota++;
    }

    const frequencia = await frequenciaService.calcularEstatisticas(
      matriculaId,
      turmaId
    );

    const situacao = this.determinaSituacao(
      mediaFinal,
      bimestresComNota,
      frequencia.percentualPresenca
    );

    return {
      situacao,
      mediaFinal,
      frequencia: frequencia.percentualPresenca,
    };
  }
}

export const notaService = new NotaService();
