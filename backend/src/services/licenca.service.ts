import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/index.js";
import {
  CreateLicencaInput,
  UpdateLicencaInput,
  AprovarLicencaInput,
} from "../schemas/index.js";
import { hojeNaRede } from "../lib/datas.js";
import { getStorageDriver } from "../storage/index.js";

/**
 * documentoPath vem do cliente. Chaves de storage são sempre geradas pelo
 * servidor (ver storage-driver.ts) e o driver local já impede sair da raiz,
 * mas DENTRO da raiz o cliente podia apontar a licença para um arquivo de
 * outra pessoa (ex.: "matriculas/<id>/<uuid>.pdf", documento de criança) — e
 * qualquer download futuro do anexo serviria esse arquivo.
 * Aceita só: "licencas/<profissionalId da licença>/<nome simples>" de um
 * arquivo que JÁ existe no storage (ou seja, gravado pelo servidor).
 * Recusa "..", caminho absoluto, barra invertida, esquema (http:, file:) e
 * qualquer outro prefixo. "" ou null limpam o campo.
 */
const ID_SEGURO = /^[A-Za-z0-9_-]{1,64}$/;
const NOME_ARQUIVO_SEGURO = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}(\.[A-Za-z0-9]{1,10})?$/;

async function validarDocumentoPath(
  documentoPath: string | null | undefined,
  profissionalId: string
): Promise<void> {
  if (documentoPath === undefined || documentoPath === null || documentoPath === "") return;
  const prefixo = `licencas/${profissionalId}/`;
  const nome = documentoPath.startsWith(prefixo) ? documentoPath.slice(prefixo.length) : "";
  if (!ID_SEGURO.test(profissionalId) || !NOME_ARQUIVO_SEGURO.test(nome)) {
    throw new Error("Documento da licença inválido");
  }
  if (!(await getStorageDriver().exists(documentoPath))) {
    throw new Error("Documento da licença não encontrado");
  }
}


/**
 * O que sai nas respostas de licença (as rotas não têm schema de resposta: a
 * saída é curada aqui). Coluna nova no modelo só aparece na API se for
 * incluída aqui.
 */
const LICENCA_SELECT = {
  id: true,
  profissionalId: true,
  tipo: true,
  dataInicio: true,
  dataFim: true,
  diasCorridos: true,
  diasUteis: true,
  motivo: true,
  observacoes: true,
  status: true,
  documentoPath: true,
  aprovadaPor: true,
  dataAprovacao: true,
  justificativaRejeicao: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LicencaSelect;

/** Profissional na licença: só identificação (nada de CPF, contato ou dados bancários). */
const LICENCA_COM_PROFISSIONAL = {
  ...LICENCA_SELECT,
  profissional: { select: { id: true, nome: true, tipo: true } },
} satisfies Prisma.LicencaSelect;

/** Relatório por profissional: só o resumo (observações, documento e decisão ficam no detalhe). */
const LICENCA_RESUMO = {
  id: true,
  profissionalId: true,
  tipo: true,
  status: true,
  dataInicio: true,
  dataFim: true,
  diasCorridos: true,
  diasUteis: true,
  motivo: true,
} satisfies Prisma.LicencaSelect;

export type LicencaResposta = Prisma.LicencaGetPayload<{ select: typeof LICENCA_SELECT }>;
export type LicencaComProfissional = Prisma.LicencaGetPayload<{ select: typeof LICENCA_COM_PROFISSIONAL }>;
export type LicencaResumo = Prisma.LicencaGetPayload<{ select: typeof LICENCA_RESUMO }>;

export class LicencaService {
  // Cria uma solicitação de licença
  async create(data: CreateLicencaInput): Promise<LicencaResposta> {
    await validarDocumentoPath(data.documentoPath, data.profissionalId);
    // Calcula dias corridos e úteis
    const diasCorridos = this.calcularDiasCorridos(
      data.dataInicio,
      data.dataFim
    );
    const diasUteis = this.calcularDiasUteis(data.dataInicio, data.dataFim);

    return await prisma.licenca.create({
      data: {
        ...data,
        diasCorridos,
        diasUteis,
        status: "PENDENTE",
      },
      select: LICENCA_SELECT,
    });
  }

  // Busca todas as licenças com filtros
  async findAll(filters?: {
    profissionalId?: string;
    status?: string;
    tipo?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }): Promise<LicencaComProfissional[]> {
    const where: Prisma.LicencaWhereInput = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.status) where.status = filters.status;
    if (filters?.tipo) where.tipo = filters.tipo;

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataInicio = {};
      if (filters.dataInicio) where.dataInicio.gte = filters.dataInicio;
      if (filters.dataFim) where.dataInicio.lte = filters.dataFim;
    }

    return await prisma.licenca.findMany({
      where,
      select: LICENCA_COM_PROFISSIONAL,
      orderBy: { createdAt: "desc" },
    });
  }

  // Busca todas as licenças com paginação
  async findAllPaginated(
    filters: {
      profissionalId?: string;
      status?: string;
      tipo?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
    pagination: { page: number; limit: number }
  ) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Prisma.LicencaWhereInput = {};

    if (filters?.profissionalId) where.profissionalId = filters.profissionalId;
    if (filters?.status) where.status = filters.status;
    if (filters?.tipo) where.tipo = filters.tipo;

    if (filters?.dataInicio || filters?.dataFim) {
      where.dataInicio = {};
      if (filters.dataInicio) where.dataInicio.gte = filters.dataInicio;
      if (filters.dataFim) where.dataInicio.lte = filters.dataFim;
    }

    const [data, total] = await Promise.all([
      prisma.licenca.findMany({
        where,
        select: LICENCA_COM_PROFISSIONAL,
        orderBy: { createdAt: "desc" },
        skip,
        take: pagination.limit,
      }),
      prisma.licenca.count({ where }),
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

  // Busca licença por ID
  async findById(id: string): Promise<LicencaComProfissional | null> {
    return await prisma.licenca.findUnique({
      where: { id },
      select: LICENCA_COM_PROFISSIONAL,
    });
  }

  // Atualiza licença (apenas se pendente)
  async update(id: string, data: UpdateLicencaInput): Promise<LicencaResposta> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (licenca && licenca.status !== "PENDENTE") {
      throw new Error(
        "Não é possível alterar uma licença que já foi aprovada ou rejeitada"
      );
    }

    // Trocar o profissional ou o documento: o documento precisa ser do
    // profissional que fica na licença
    if (data.documentoPath !== undefined || data.profissionalId !== undefined) {
      const profissionalId = data.profissionalId ?? licenca?.profissionalId;
      const documentoPath = data.documentoPath !== undefined ? data.documentoPath : licenca?.documentoPath;
      if (profissionalId) await validarDocumentoPath(documentoPath, profissionalId);
    }

    // Recalcula dias se datas foram alteradas
    const updateData: Prisma.LicencaUncheckedUpdateInput = { ...data };
    if (data.dataInicio || data.dataFim) {
      const dataInicio = data.dataInicio || licenca?.dataInicio;
      const dataFim = data.dataFim || licenca?.dataFim;

      if (dataInicio && dataFim) {
        updateData.diasCorridos = this.calcularDiasCorridos(
          dataInicio,
          dataFim
        );
        updateData.diasUteis = this.calcularDiasUteis(dataInicio, dataFim);
      }
    }

    return await prisma.licenca.update({
      where: { id },
      data: updateData,
      select: LICENCA_SELECT,
    });
  }

  // Aprova ou rejeita uma licença
  async aprovar(id: string, data: AprovarLicencaInput): Promise<LicencaResposta> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (!licenca) {
      throw new NotFoundError("NF_014");
    }

    if (licenca.status !== "PENDENTE") {
      throw new Error("Esta licença já foi processada");
    }

    return await prisma.licenca.update({
      where: { id },
      data: {
        status: data.status,
        aprovadaPor: data.aprovadaPor,
        dataAprovacao: new Date(),
        justificativaRejeicao: data.justificativaRejeicao,
      },
      select: LICENCA_SELECT,
    });
  }

  // Cancela uma licença
  async cancelar(id: string): Promise<LicencaResposta> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (!licenca) {
      throw new NotFoundError("NF_014");
    }

    if (licenca.status === "CANCELADA") {
      throw new Error("Esta licença já foi cancelada");
    }

    return await prisma.licenca.update({
      where: { id },
      data: { status: "CANCELADA" },
      select: LICENCA_SELECT,
    });
  }

  // Remove licença (apenas se pendente ou cancelada)
  async delete(id: string): Promise<void> {
    const licenca = await prisma.licenca.findUnique({ where: { id } });

    if (licenca && !["PENDENTE", "CANCELADA"].includes(licenca.status)) {
      throw new Error(
        "Não é possível excluir uma licença aprovada ou rejeitada"
      );
    }

    await prisma.licenca.delete({ where: { id } });
  }

  // Busca licenças ativas (aprovadas e dentro do período)
  async findLicencasAtivas(): Promise<LicencaComProfissional[]> {
    const hoje = hojeNaRede();

    return await prisma.licenca.findMany({
      where: {
        status: "APROVADA",
        dataInicio: { lte: hoje },
        dataFim: { gte: hoje },
      },
      select: LICENCA_COM_PROFISSIONAL,
    });
  }

  // Relatório de licenças por profissional
  async relatorioPorProfissional(
    profissionalId: string,
    anoInicio?: number,
    anoFim?: number
  ): Promise<{
    licencas: LicencaResumo[];
    totalDias: number;
    porTipo: Record<string, number>;
  }> {
    const where: Prisma.LicencaWhereInput = { profissionalId };

    if (anoInicio || anoFim) {
      where.dataInicio = {};
      if (anoInicio)
        where.dataInicio.gte = new Date(`${anoInicio}-01-01`);
      if (anoFim)
        where.dataInicio.lte = new Date(`${anoFim}-12-31`);
    }

    const licencas = await prisma.licenca.findMany({
      where,
      select: LICENCA_RESUMO,
      orderBy: { dataInicio: "desc" },
    });

    const totalDias = licencas.reduce(
      (acc, l) => acc + (l.diasCorridos || 0),
      0
    );

    const porTipo: Record<string, number> = {};
    licencas.forEach((l) => {
      if (!porTipo[l.tipo]) porTipo[l.tipo] = 0;
      porTipo[l.tipo] += l.diasCorridos;
    });

    return { licencas, totalDias, porTipo };
  }

  // Calcula dias corridos entre duas datas
  private calcularDiasCorridos(inicio: Date, fim: Date): number {
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclui o dia final
  }

  // Calcula dias úteis entre duas datas (ignora sábados e domingos)
  private calcularDiasUteis(inicio: Date, fim: Date): number {
    let count = 0;
    const current = new Date(inicio);

    while (current <= fim) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Domingo, 6 = Sábado
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export const licencaService = new LicencaService();
