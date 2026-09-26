import { Prisma } from "@prisma/client";
import { prisma, prismaSemEscopo } from "../lib/prisma.js";
import { BusinessError, NotFoundError } from "../errors/index.js";
import { sobrepoe, type Intervalo } from "../lib/horarios.js";
import type { CreateAcInput, UpdateAcInput } from "../schemas/rh.schemas.js";

const incluir = {
  escola: { select: { id: true, nome: true } },
  coordenador: { select: { id: true, nome: true } },
  participantes: { select: { profissional: { select: { id: true, nome: true } } } },
} satisfies Prisma.AtividadeComplementarInclude;

type AcComRelacoes = Prisma.AtividadeComplementarGetPayload<{ include: typeof incluir }>;

/** Achata participantes para [{ id, nome }]. */
function formatar(ac: AcComRelacoes) {
  const { participantes, ...resto } = ac;
  return { ...resto, participantes: participantes.map((p) => p.profissional) };
}

/**
 * Atividade Complementar (AC): horário fixo de planejamento por área.
 * Regras: participantes e coordenador precisam estar lotados na escola (ou
 * lecionar nela) e o horário não pode bater com aula ou outra AC deles.
 */
export class AtividadeComplementarService {
  async listar(filtros: { escolaId?: string; area?: string; diaSemana?: string; ativo?: boolean }) {
    const where: Prisma.AtividadeComplementarWhereInput = {};
    if (filtros.escolaId) where.escolaId = filtros.escolaId;
    if (filtros.area) where.area = filtros.area;
    if (filtros.diaSemana) where.diaSemana = filtros.diaSemana;
    if (filtros.ativo !== undefined) where.ativo = filtros.ativo;
    const acs = await prisma.atividadeComplementar.findMany({
      where,
      include: incluir,
      orderBy: [{ escolaId: "asc" }, { diaSemana: "asc" }, { horaInicio: "asc" }],
    });
    return acs.map(formatar);
  }

  async buscar(id: string) {
    const ac = await prisma.atividadeComplementar.findUnique({ where: { id }, include: incluir });
    if (!ac) throw new NotFoundError("NF_001", { recurso: "AC" });
    return formatar(ac);
  }

  async criar(dados: CreateAcInput) {
    const { participantes, ...campos } = dados;
    const escola = await prisma.escola.findUnique({ where: { id: dados.escolaId }, select: { id: true } });
    if (!escola) throw new NotFoundError("NF_003");
    const envolvidos = this.envolvidos(participantes, dados.coordenadorId);
    await this.validarLotacao(dados.escolaId, envolvidos);
    await this.validarConflitos(envolvidos, dados);
    const ac = await prisma.atividadeComplementar.create({
      data: {
        ...campos,
        participantes: { create: [...new Set(participantes)].map((profissionalId) => ({ profissionalId })) },
      },
      include: incluir,
    });
    return formatar(ac);
  }

  async atualizar(id: string, dados: UpdateAcInput) {
    const atual = await prisma.atividadeComplementar.findUnique({
      where: { id },
      include: { participantes: { select: { profissionalId: true } } },
    });
    if (!atual) throw new NotFoundError("NF_001", { recurso: "AC" });
    const { participantes, ...campos } = dados;
    const horario = {
      diaSemana: campos.diaSemana ?? atual.diaSemana,
      horaInicio: campos.horaInicio ?? atual.horaInicio,
      horaFim: campos.horaFim ?? atual.horaFim,
    };
    if (horario.horaFim <= horario.horaInicio) throw new BusinessError("BIZ_038");
    const lista = participantes ?? atual.participantes.map((p) => p.profissionalId);
    const coordenador = campos.coordenadorId !== undefined ? campos.coordenadorId : atual.coordenadorId ?? undefined;
    const envolvidos = this.envolvidos(lista, coordenador);
    const ativo = campos.ativo ?? atual.ativo;
    if (ativo) {
      await this.validarLotacao(atual.escolaId, envolvidos);
      await this.validarConflitos(envolvidos, horario, id);
    }
    const ac = await prisma.$transaction(async (tx) => {
      if (participantes) {
        await tx.acParticipante.deleteMany({ where: { acId: id } });
        await tx.acParticipante.createMany({
          data: [...new Set(participantes)].map((profissionalId) => ({ acId: id, profissionalId })),
        });
      }
      return tx.atividadeComplementar.update({ where: { id }, data: campos, include: incluir });
    });
    return formatar(ac);
  }

  async remover(id: string) {
    const existe = await prisma.atividadeComplementar.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundError("NF_001", { recurso: "AC" });
    await prisma.atividadeComplementar.delete({ where: { id } });
    return { message: "AC removida" };
  }

  private envolvidos(participantes: string[], coordenadorId?: string | null) {
    return [...new Set([...participantes, ...(coordenadorId ? [coordenadorId] : [])])];
  }

  /** BIZ_036 se alguém não estiver lotado na escola nem lecionar numa turma dela. */
  private async validarLotacao(escolaId: string, profissionais: string[]) {
    if (!profissionais.length) return;
    const [lotados, docentes] = await Promise.all([
      prismaSemEscopo.escolaProfissional.findMany({
        where: { escolaId, profissionalId: { in: profissionais } },
        select: { profissionalId: true },
      }),
      prismaSemEscopo.turmaProfessor.findMany({
        where: { profissionalId: { in: profissionais }, turma: { escolaId } },
        select: { profissionalId: true },
      }),
    ]);
    const ok = new Set([...lotados, ...docentes].map((x) => x.profissionalId));
    const fora = profissionais.filter((p) => !ok.has(p));
    if (fora.length) {
      const nomes = await prismaSemEscopo.profissionalEducacao.findMany({
        where: { id: { in: fora } },
        select: { nome: true },
      });
      throw new BusinessError("BIZ_036", { profissionais: nomes.map((n) => n.nome) });
    }
  }

  /**
   * BIZ_037 se o horário bate com aula da grade (em qualquer escola) ou com
   * outra AC ativa de alguém envolvido. A checagem vê a rede toda (sem
   * escopo), mas o erro só informa o tipo e o horário — não a outra escola.
   */
  private async validarConflitos(profissionais: string[], horario: Intervalo, ignorarAcId?: string) {
    if (!profissionais.length) return;
    const [aulas, acs] = await Promise.all([
      prismaSemEscopo.gradeHoraria.findMany({
        where: { profissionalId: { in: profissionais }, diaSemana: horario.diaSemana },
        select: { diaSemana: true, horaInicio: true, horaFim: true, profissional: { select: { nome: true } } },
      }),
      prismaSemEscopo.atividadeComplementar.findMany({
        where: {
          ativo: true,
          diaSemana: horario.diaSemana,
          ...(ignorarAcId ? { id: { not: ignorarAcId } } : {}),
          OR: [
            { coordenadorId: { in: profissionais } },
            { participantes: { some: { profissionalId: { in: profissionais } } } },
          ],
        },
        select: { diaSemana: true, horaInicio: true, horaFim: true },
      }),
    ]);
    const conflitos = [
      ...aulas.filter((a) => sobrepoe(a, horario)).map((a) => ({
        tipo: "AULA", profissional: a.profissional?.nome ?? null, horario: `${a.horaInicio}–${a.horaFim}`,
      })),
      ...acs.filter((a) => sobrepoe(a, horario)).map((a) => ({
        tipo: "AC", profissional: null, horario: `${a.horaInicio}–${a.horaFim}`,
      })),
    ];
    if (conflitos.length) throw new BusinessError("BIZ_037", { conflitos });
  }
}

export const atividadeComplementarService = new AtividadeComplementarService();
