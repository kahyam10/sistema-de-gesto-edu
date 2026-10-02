import bcrypt from "bcryptjs";
import { prisma, prismaSemEscopo } from "../lib/prisma.js";
import { BusinessError, NotFoundError } from "../errors/index.js";
import { documentoMatriculaService } from "./documento-matricula.service.js";
import {
  CreateMatriculaInput,
  CriarAcessoMatriculaInput,
  UpdateMatriculaInput,
} from "../schemas/index.js";

// Função para gerar número de matrícula único
function gerarNumeroMatricula(anoLetivo: number): string {
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${anoLetivo}${random}`;
}

export class MatriculaService {
  async findAll(filters?: {
    escolaId?: string;
    etapaId?: string;
    turmaId?: string;
    anoLetivo?: number;
    status?: string;
  }) {
    return prisma.matricula.findMany({
      where: filters,
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async findById(id: string) {
    return prisma.matricula.findUnique({
      where: { id },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
        transferencias: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findByNumero(numeroMatricula: string) {
    return prisma.matricula.findUnique({
      where: { numeroMatricula },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async findSemTurma(escolaId?: string, anoLetivo?: number) {
    return prisma.matricula.findMany({
      where: {
        turmaId: null,
        status: "ATIVA",
        ...(escolaId && { escolaId }),
        ...(anoLetivo && { anoLetivo }),
      },
      include: {
        escola: true,
        etapa: true,
      },
      orderBy: { nomeAluno: "asc" },
    });
  }

  async create(data: CreateMatriculaInput) {
    // Verifica se CPF já existe (se fornecido)
    if (data.cpfAluno) {
      const existing = await prisma.matricula.findFirst({
        where: {
          cpfAluno: data.cpfAluno,
          anoLetivo: data.anoLetivo,
          status: "ATIVA",
        },
      });
      if (existing) {
        throw new Error(
          "Já existe uma matrícula ativa com este CPF para o ano letivo"
        );
      }
    }

    // Gera número de matrícula único
    let numeroMatricula = gerarNumeroMatricula(data.anoLetivo);
    let exists = await prisma.matricula.findUnique({
      where: { numeroMatricula },
    });
    while (exists) {
      numeroMatricula = gerarNumeroMatricula(data.anoLetivo);
      exists = await prisma.matricula.findUnique({
        where: { numeroMatricula },
      });
    }

    return prisma.matricula.create({
      data: {
        ...data,
        numeroMatricula,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async update(id: string, data: UpdateMatriculaInput) {
    return prisma.matricula.update({
      where: { id },
      data: {
        ...data,
        emailResponsavel: data.emailResponsavel || null,
      },
      include: {
        escola: true,
        etapa: true,
        turma: { include: { serie: true } },
      },
    });
  }

  async delete(id: string) {
    // LGPD: remove os arquivos físicos antes do cascade apagar os registros
    await documentoMatriculaService.expurgarArquivos(id);
    return prisma.matricula.delete({
      where: { id },
    });
  }

  async cancelar(id: string) {
    return prisma.matricula.update({
      where: { id },
      data: {
        status: "CANCELADA",
        turmaId: null,
      },
    });
  }

  async transferir(
    id: string,
    novaEscolaId: string,
    novaTurmaId?: string,
    motivo?: string
  ) {
    // A ORIGEM precisa estar no escopo de quem transfere (cliente com escopo:
    // a secretaria só transfere alunos da própria escola)...
    const origem = await prisma.matricula.findUnique({ where: { id }, select: { id: true } });
    if (!origem) throw new NotFoundError("NF_004");
    // ...e a turma de destino precisa ser da escola de destino
    if (novaTurmaId) {
      const turmaDestino = await prismaSemEscopo.turma.findUnique({
        where: { id: novaTurmaId },
        select: { escolaId: true },
      });
      if (!turmaDestino || turmaDestino.escolaId !== novaEscolaId) {
        throw new BusinessError("BIZ_035");
      }
    }
    // O destino é outra escola da rede (fora do escopo da origem): a escrita
    // usa o cliente sem escopo, com a origem já validada acima.
    return prismaSemEscopo.$transaction(async (tx) => {
      const atual = await tx.matricula.findUnique({ where: { id } });
      if (!atual) throw new NotFoundError("NF_004");

      await tx.transferenciaMatricula.create({
        data: {
          matriculaId: id,
          escolaOrigemId: atual.escolaId,
          escolaDestinoId: novaEscolaId,
          turmaOrigemId: atual.turmaId,
          turmaDestinoId: novaTurmaId || null,
          motivo: motivo || null,
        },
      });

      return tx.matricula.update({
        where: { id },
        data: {
          escolaId: novaEscolaId,
          turmaId: novaTurmaId || null,
          status: "TRANSFERIDA",
        },
      });
    });
  }

  async getTransferencias(id: string) {
    return prisma.transferenciaMatricula.findMany({
      where: { matriculaId: id },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEstatisticas(anoLetivo: number, escolaId?: string) {
    const where = {
      anoLetivo,
      ...(escolaId && { escolaId }),
    };

    const [total, ativas, pcd, semTurma] = await Promise.all([
      prisma.matricula.count({ where }),
      prisma.matricula.count({ where: { ...where, status: "ATIVA" } }),
      prisma.matricula.count({ where: { ...where, possuiDeficiencia: true } }),
      prisma.matricula.count({
        where: { ...where, turmaId: null, status: "ATIVA" },
      }),
    ]);

    return {
      total,
      ativas,
      pcd,
      semTurma,
      percentualPCD: total > 0 ? Math.round((pcd / total) * 100) : 0,
    };
  }

  // ==================== MÓDULO 3: ACESSOS DO PORTAL (responsáveis) ====================

  async listarAcessos(matriculaId: string) {
    const matricula = await prisma.matricula.findUnique({ where: { id: matriculaId } });
    if (!matricula) throw new NotFoundError("NF_004");
    return prisma.matriculaUsuario.findMany({
      where: { matriculaId },
      include: { user: { select: { id: true, nome: true, email: true, role: true, ativo: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Cria (ou reaproveita) o usuário RESPONSAVEL e o vincula à matrícula.
   * - email já existe → reutiliza o usuário (senha NÃO é alterada), apenas vincula —
   *   SÓ se a conta for de RESPONSAVEL. Conta de servidor/equipe (ou de outro
   *   papel) nunca vira acesso de responsável: AUTH_004 (409).
   * - email não existe → exige nome+senha (BIZ_024) e cria User role RESPONSAVEL.
   * - vínculo já existe ativo → BIZ_022; existe inativo → reativa.
   */
  async criarAcesso(matriculaId: string, data: CriarAcessoMatriculaInput) {
    const matricula = await prisma.matricula.findUnique({ where: { id: matriculaId } });
    if (!matricula) throw new NotFoundError("NF_004");

    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: data.email } });
      if (!user) {
        if (!data.nome || !data.senha) throw new BusinessError("BIZ_024");
        user = await tx.user.create({
          data: {
            email: data.email,
            nome: data.nome,
            password: await bcrypt.hash(data.senha, 10),
            role: "RESPONSAVEL",
          },
        });
      } else if (user.role !== "RESPONSAVEL") {
        throw new BusinessError("AUTH_004", { motivo: "e-mail pertence a uma conta que não é de responsável" });
      }
      const existente = await tx.matriculaUsuario.findUnique({
        where: { matriculaId_userId: { matriculaId, userId: user.id } },
      });
      if (existente?.ativo) throw new BusinessError("BIZ_022");
      if (existente) {
        return tx.matriculaUsuario.update({
          where: { id: existente.id },
          data: { ativo: true, tipoVinculo: data.tipoVinculo, parentesco: data.parentesco ?? null },
          include: { user: { select: { id: true, nome: true, email: true, role: true } } },
        });
      }
      return tx.matriculaUsuario.create({
        data: {
          matriculaId,
          userId: user.id,
          tipoVinculo: data.tipoVinculo,
          parentesco: data.parentesco ?? null,
        },
        include: { user: { select: { id: true, nome: true, email: true, role: true } } },
      });
    });
  }

  async revogarAcesso(matriculaId: string, vinculoId: string) {
    const vinculo = await prisma.matriculaUsuario.findFirst({
      where: { id: vinculoId, matriculaId },
    });
    if (!vinculo) throw new NotFoundError("NF_030");
    await prisma.matriculaUsuario.delete({ where: { id: vinculoId } });
    return { message: "Acesso revogado com sucesso" };
  }
}

export const matriculaService = new MatriculaService();
