import { prisma } from "../lib/prisma.js";

export interface CreateAnoLetivoInput {
  ano: number;
  ativo?: boolean;
}

export interface UpdateAnoLetivoInput {
  ano?: number;
  ativo?: boolean;
}

export interface CreateEventoInput {
  titulo: string;
  descricao?: string;
  dataInicio: Date;
  dataFim?: Date;
  horaInicio?: string;
  horaFim?: string;
  tipo: string;
  escopo?: string;
  recorrente?: boolean;
  tipoRecorrencia?: string;
  diaRecorrencia?: string;
  cor?: string;
  reduzDiaLetivo?: boolean;
  anoLetivoId: string;
  escolaId?: string;
}

export interface UpdateEventoInput {
  titulo?: string;
  descricao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  horaInicio?: string;
  horaFim?: string;
  tipo?: string;
  escopo?: string;
  recorrente?: boolean;
  tipoRecorrencia?: string;
  diaRecorrencia?: string;
  cor?: string;
  reduzDiaLetivo?: boolean;
  escolaId?: string;
}

// Status do ano letivo baseado nos eventos
export interface StatusAnoLetivo {
  // Início e Fim do Ano Letivo (define intervalo para cadastro de eventos)
  temInicioDefinido: boolean;
  temFimDefinido: boolean;
  dataInicioAnoLetivo: Date | null;
  dataFimAnoLetivo: Date | null;

  // Início e Fim das Aulas Regulares (define período para contabilização de dias letivos)
  temInicioAulasDefinido: boolean;
  temFimAulasDefinido: boolean;
  dataInicioAulas: Date | null;
  dataFimAulas: Date | null;

  // Controle de fluxo
  podeAdicionarEventos: boolean;
  podeContabilizarDiasLetivos: boolean;
  proximoEventoObrigatorio:
    | "INICIO_ANO_LETIVO"
    | "FIM_ANO_LETIVO"
    | "INICIO_AULAS_REGULARES"
    | "FIM_AULAS_REGULARES"
    | null;

  // Legado (manter compatibilidade)
  dataInicio: Date | null;
  dataFim: Date | null;
}

export class CalendarioService {
  // ==================== ANO LETIVO ====================

  async findAllAnosLetivos() {
    const anosLetivos = await prisma.anoLetivo.findMany({
      include: {
        eventos: {
          orderBy: { dataInicio: "asc" },
        },
      },
      orderBy: { ano: "desc" },
    });

    // Adiciona status para cada ano letivo
    return anosLetivos.map((anoLetivo) => ({
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    }));
  }

  async findAnoLetivoAtivo() {
    const anoLetivo = await prisma.anoLetivo.findFirst({
      where: { ativo: true },
      include: {
        eventos: {
          orderBy: { dataInicio: "asc" },
        },
      },
    });

    if (!anoLetivo) return null;

    return {
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    };
  }

  async findAnoLetivoById(id: string) {
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { id },
      include: {
        eventos: {
          orderBy: { dataInicio: "asc" },
        },
      },
    });

    if (!anoLetivo) return null;

    return {
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    };
  }

  async findAnoLetivoByAno(ano: number) {
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { ano },
      include: {
        eventos: {
          orderBy: { dataInicio: "asc" },
        },
      },
    });

    if (!anoLetivo) return null;

    return {
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    };
  }

  // Calcula o status do ano letivo baseado nos eventos
  calcularStatusAnoLetivo(
    eventos: Array<{ tipo: string; dataInicio: Date }>
  ): StatusAnoLetivo {
    // Eventos de definição do ano letivo (intervalo para cadastro de eventos)
    const eventoInicioAnoLetivo = eventos.find(
      (e) => e.tipo === "INICIO_ANO_LETIVO"
    );
    const eventoFimAnoLetivo = eventos.find((e) => e.tipo === "FIM_ANO_LETIVO");

    // Eventos de aulas regulares (período para contabilização de dias letivos)
    const eventoInicioAulas = eventos.find(
      (e) => e.tipo === "INICIO_AULAS_REGULARES"
    );
    const eventoFimAulas = eventos.find(
      (e) => e.tipo === "FIM_AULAS_REGULARES"
    );

    const temInicioDefinido = !!eventoInicioAnoLetivo;
    const temFimDefinido = !!eventoFimAnoLetivo;
    const temInicioAulasDefinido = !!eventoInicioAulas;
    const temFimAulasDefinido = !!eventoFimAulas;

    // Pode adicionar eventos quando tiver início e fim do ano letivo definidos
    const podeAdicionarEventos = temInicioDefinido && temFimDefinido;

    // Determina o próximo evento obrigatório na sequência
    let proximoEventoObrigatorio:
      | "INICIO_ANO_LETIVO"
      | "FIM_ANO_LETIVO"
      | "INICIO_AULAS_REGULARES"
      | "FIM_AULAS_REGULARES"
      | null = null;

    if (!temInicioDefinido) {
      proximoEventoObrigatorio = "INICIO_ANO_LETIVO";
    } else if (!temFimDefinido) {
      proximoEventoObrigatorio = "FIM_ANO_LETIVO";
    } else if (!temInicioAulasDefinido) {
      proximoEventoObrigatorio = "INICIO_AULAS_REGULARES";
    } else if (!temFimAulasDefinido) {
      proximoEventoObrigatorio = "FIM_AULAS_REGULARES";
    }

    return {
      // Ano Letivo
      temInicioDefinido,
      temFimDefinido,
      dataInicioAnoLetivo: eventoInicioAnoLetivo?.dataInicio || null,
      dataFimAnoLetivo: eventoFimAnoLetivo?.dataInicio || null,

      // Aulas Regulares
      temInicioAulasDefinido,
      temFimAulasDefinido,
      dataInicioAulas: eventoInicioAulas?.dataInicio || null,
      dataFimAulas: eventoFimAulas?.dataInicio || null,

      // Controle
      podeAdicionarEventos,
      podeContabilizarDiasLetivos:
        temInicioAulasDefinido && temFimAulasDefinido,
      proximoEventoObrigatorio,

      // Legado (para compatibilidade - usa datas das aulas se disponível, senão do ano)
      dataInicio:
        eventoInicioAulas?.dataInicio ||
        eventoInicioAnoLetivo?.dataInicio ||
        null,
      dataFim:
        eventoFimAulas?.dataInicio || eventoFimAnoLetivo?.dataInicio || null,
    };
  }

  async createAnoLetivo(data: CreateAnoLetivoInput) {
    // Verifica se ano já existe
    const existing = await prisma.anoLetivo.findUnique({
      where: { ano: data.ano },
    });
    if (existing) {
      throw new Error(`Já existe um ano letivo cadastrado para ${data.ano}`);
    }

    // Se for criar como ativo, desativa os outros
    if (data.ativo) {
      await prisma.anoLetivo.updateMany({
        where: { ativo: true },
        data: { ativo: false },
      });
    }

    const anoLetivo = await prisma.anoLetivo.create({
      data: {
        ano: data.ano,
        ativo: data.ativo ?? false,
      },
      include: {
        eventos: true,
      },
    });

    return {
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    };
  }

  async updateAnoLetivo(id: string, data: UpdateAnoLetivoInput) {
    // Se for ativar, desativa os outros
    if (data.ativo === true) {
      await prisma.anoLetivo.updateMany({
        where: { ativo: true, id: { not: id } },
        data: { ativo: false },
      });
    }

    const anoLetivo = await prisma.anoLetivo.update({
      where: { id },
      data,
      include: {
        eventos: true,
      },
    });

    return {
      ...anoLetivo,
      status: this.calcularStatusAnoLetivo(anoLetivo.eventos),
    };
  }

  async deleteAnoLetivo(id: string) {
    return prisma.anoLetivo.delete({
      where: { id },
    });
  }

  // ==================== EVENTOS ====================

  async findEventosByAnoLetivo(anoLetivoId: string, escolaId?: string) {
    const where: {
      anoLetivoId: string;
      escolaId?: string | null;
      OR?: { escolaId: string | null }[];
    } = {
      anoLetivoId,
    };

    if (escolaId) {
      // Com escolaId: retorna eventos globais (escolaId = null) + eventos específicos da escola
      where.OR = [{ escolaId: null }, { escolaId }];
    } else {
      // Sem escolaId: retorna apenas eventos globais
      where.escolaId = null;
    }

    return prisma.eventoCalendario.findMany({
      where,
      include: {
        escola: true,
      },
      orderBy: { dataInicio: "asc" },
    });
  }

  async findEventosByData(anoLetivoId: string, data: Date, escolaId?: string) {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtrar por escola se necessário
    if (escolaId) {
      // Com escolaId: retorna eventos globais + eventos específicos da escola
      return prisma.eventoCalendario.findMany({
        where: {
          anoLetivoId,
          dataInicio: { lte: endOfDay },
          AND: [
            {
              OR: [{ dataFim: { gte: startOfDay } }, { dataFim: null }],
            },
            {
              OR: [{ escolaId: null }, { escolaId }],
            },
          ],
        },
        include: {
          escola: true,
        },
        orderBy: { dataInicio: "asc" },
      });
    }

    // Sem escolaId: retorna apenas eventos globais
    return prisma.eventoCalendario.findMany({
      where: {
        anoLetivoId,
        escolaId: null,
        dataInicio: { lte: endOfDay },
        OR: [{ dataFim: { gte: startOfDay } }, { dataFim: null }],
      },
      include: {
        escola: true,
      },
      orderBy: { dataInicio: "asc" },
    });
  }

  async findEventoById(id: string) {
    return prisma.eventoCalendario.findUnique({
      where: { id },
      include: {
        escola: true,
        anoLetivo: true,
      },
    });
  }

  async createEvento(data: CreateEventoInput) {
    // Buscar o ano letivo com eventos
    const anoLetivo = await this.findAnoLetivoById(data.anoLetivoId);
    if (!anoLetivo) {
      throw new Error("Ano letivo não encontrado");
    }

    const status = anoLetivo.status;

    // Validações especiais para eventos obrigatórios de estrutura
    if (data.tipo === "INICIO_ANO_LETIVO") {
      if (status.temInicioDefinido) {
        throw new Error("O Início do Ano Letivo já foi definido");
      }
    } else if (data.tipo === "FIM_ANO_LETIVO") {
      if (!status.temInicioDefinido) {
        throw new Error(
          "É necessário definir o Início do Ano Letivo antes do Fim"
        );
      }
      if (status.temFimDefinido) {
        throw new Error("O Fim do Ano Letivo já foi definido");
      }
      // Validar que a data de fim é posterior à data de início
      if (
        status.dataInicioAnoLetivo &&
        data.dataInicio <= status.dataInicioAnoLetivo
      ) {
        throw new Error(
          "A data de Fim do Ano Letivo deve ser posterior à data de Início"
        );
      }
    } else if (data.tipo === "INICIO_AULAS_REGULARES") {
      // Precisa ter início e fim do ano letivo definidos
      if (!status.podeAdicionarEventos) {
        throw new Error(
          "É necessário definir o Início e Fim do Ano Letivo antes de definir as Aulas Regulares"
        );
      }
      if (status.temInicioAulasDefinido) {
        throw new Error("O Início das Aulas Regulares já foi definido");
      }
      // Validar que está dentro do período do ano letivo
      if (status.dataInicioAnoLetivo && status.dataFimAnoLetivo) {
        if (
          data.dataInicio < status.dataInicioAnoLetivo ||
          data.dataInicio > status.dataFimAnoLetivo
        ) {
          throw new Error(
            "A data de Início das Aulas deve estar dentro do período do ano letivo"
          );
        }
      }
    } else if (data.tipo === "FIM_AULAS_REGULARES") {
      if (!status.temInicioAulasDefinido) {
        throw new Error(
          "É necessário definir o Início das Aulas Regulares antes do Fim"
        );
      }
      if (status.temFimAulasDefinido) {
        throw new Error("O Fim das Aulas Regulares já foi definido");
      }
      // Validar que a data de fim é posterior à data de início das aulas
      if (status.dataInicioAulas && data.dataInicio <= status.dataInicioAulas) {
        throw new Error(
          "A data de Fim das Aulas Regulares deve ser posterior à data de Início das Aulas"
        );
      }
      // Validar que está dentro do período do ano letivo
      if (
        status.dataFimAnoLetivo &&
        data.dataInicio > status.dataFimAnoLetivo
      ) {
        throw new Error(
          "A data de Fim das Aulas deve estar dentro do período do ano letivo"
        );
      }
    } else {
      // Outros tipos de evento só podem ser criados se início e fim do ano letivo estiverem definidos
      if (!status.podeAdicionarEventos) {
        throw new Error(
          "É necessário definir o Início e Fim do Ano Letivo antes de adicionar outros eventos"
        );
      }

      // Validar que o evento está dentro do período do ano letivo
      if (status.dataInicioAnoLetivo && status.dataFimAnoLetivo) {
        if (
          data.dataInicio < status.dataInicioAnoLetivo ||
          data.dataInicio > status.dataFimAnoLetivo
        ) {
          throw new Error(
            "A data do evento deve estar dentro do período do ano letivo"
          );
        }
        if (data.dataFim && data.dataFim > status.dataFimAnoLetivo) {
          throw new Error(
            "A data final do evento deve estar dentro do período do ano letivo"
          );
        }
      }
    }

    return prisma.eventoCalendario.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        horaInicio: data.horaInicio,
        horaFim: data.horaFim,
        tipo: data.tipo,
        escopo: data.escopo ?? "REDE",
        recorrente: data.recorrente ?? false,
        tipoRecorrencia: data.tipoRecorrencia,
        diaRecorrencia: data.diaRecorrencia,
        cor: data.cor ?? "#3B82F6",
        reduzDiaLetivo: data.reduzDiaLetivo ?? false,
        anoLetivoId: data.anoLetivoId,
        escolaId: data.escolaId,
      },
      include: {
        escola: true,
      },
    });
  }

  async updateEvento(id: string, data: UpdateEventoInput) {
    const evento = await this.findEventoById(id);
    if (!evento) {
      throw new Error("Evento não encontrado");
    }

    // Não permitir alteração do tipo para eventos obrigatórios de estrutura
    const tiposEstruturais = [
      "INICIO_ANO_LETIVO",
      "FIM_ANO_LETIVO",
      "INICIO_AULAS_REGULARES",
      "FIM_AULAS_REGULARES",
    ];
    if (data.tipo && tiposEstruturais.includes(data.tipo)) {
      if (evento.tipo !== data.tipo) {
        throw new Error(
          "Não é permitido alterar um evento para tipo estrutural (Início/Fim do Ano Letivo ou Aulas Regulares)"
        );
      }
    }

    return prisma.eventoCalendario.update({
      where: { id },
      data,
      include: {
        escola: true,
      },
    });
  }

  async deleteEvento(id: string) {
    const evento = await this.findEventoById(id);
    if (!evento) {
      throw new Error("Evento não encontrado");
    }

    const tiposEstruturais = [
      "INICIO_ANO_LETIVO",
      "FIM_ANO_LETIVO",
      "INICIO_AULAS_REGULARES",
      "FIM_AULAS_REGULARES",
    ];

    // Verificar se é um FIM_AULAS_REGULARES - pode excluir se não há problema
    if (evento.tipo === "FIM_AULAS_REGULARES") {
      // Pode excluir sem restrições
    }

    // Se for INICIO_AULAS_REGULARES, verificar se existe FIM_AULAS_REGULARES
    if (evento.tipo === "INICIO_AULAS_REGULARES") {
      const fimAulas = await prisma.eventoCalendario.findFirst({
        where: {
          anoLetivoId: evento.anoLetivoId,
          tipo: "FIM_AULAS_REGULARES",
        },
      });

      if (fimAulas) {
        throw new Error(
          "Não é possível excluir o Início das Aulas Regulares enquanto o Fim estiver definido"
        );
      }
    }

    // Se for FIM_ANO_LETIVO, verificar se há outros eventos além dos estruturais
    if (evento.tipo === "FIM_ANO_LETIVO") {
      const outrosEventos = await prisma.eventoCalendario.count({
        where: {
          anoLetivoId: evento.anoLetivoId,
          tipo: {
            notIn: tiposEstruturais,
          },
        },
      });

      if (outrosEventos > 0) {
        throw new Error(
          "Não é possível excluir o Fim do Ano Letivo enquanto houver outros eventos cadastrados"
        );
      }

      // Verificar se há eventos de aulas definidos
      const aulasDefinidas = await prisma.eventoCalendario.count({
        where: {
          anoLetivoId: evento.anoLetivoId,
          tipo: {
            in: ["INICIO_AULAS_REGULARES", "FIM_AULAS_REGULARES"],
          },
        },
      });

      if (aulasDefinidas > 0) {
        throw new Error(
          "Não é possível excluir o Fim do Ano Letivo enquanto houver datas de aulas definidas"
        );
      }
    }

    // Se for INICIO_ANO_LETIVO, verificar se existe FIM_ANO_LETIVO
    if (evento.tipo === "INICIO_ANO_LETIVO") {
      const fimAnoLetivo = await prisma.eventoCalendario.findFirst({
        where: {
          anoLetivoId: evento.anoLetivoId,
          tipo: "FIM_ANO_LETIVO",
        },
      });

      if (fimAnoLetivo) {
        throw new Error(
          "Não é possível excluir o Início do Ano Letivo enquanto o Fim estiver definido"
        );
      }
    }

    return prisma.eventoCalendario.delete({
      where: { id },
    });
  }

  // ==================== ESTATÍSTICAS ====================

  async calcularDiasLetivos(anoLetivoId: string, escolaId?: string) {
    // Query otimizada: buscar ano letivo com eventos em uma única consulta
    const anoLetivo = await prisma.anoLetivo.findUnique({
      where: { id: anoLetivoId },
      include: {
        eventos: {
          where: escolaId
            ? { OR: [{ escolaId: null }, { escolaId }] }
            : { escolaId: null },
          orderBy: { dataInicio: "asc" },
          include: { escola: true },
        },
      },
    });

    if (!anoLetivo) {
      throw new Error("Ano letivo não encontrado");
    }

    const eventos = anoLetivo.eventos;
    const status = this.calcularStatusAnoLetivo(eventos);

    // Se não tiver início e fim do ano letivo definidos, retornar estatísticas vazias
    if (!status.podeAdicionarEventos) {
      return {
        diasTotais: null,
        diasLetivos: null,
        sabadosLetivos: null,
        feriados: null,
        domingos: null,
        eventos: eventos.length,
        feriadosEventos: 0,
        dataInicioAnoLetivo: status.dataInicioAnoLetivo,
        dataFimAnoLetivo: status.dataFimAnoLetivo,
        dataInicioAulas: status.dataInicioAulas,
        dataFimAulas: status.dataFimAulas,
        status: {
          temInicioDefinido: status.temInicioDefinido,
          temFimDefinido: status.temFimDefinido,
          temInicioAulasDefinido: status.temInicioAulasDefinido,
          temFimAulasDefinido: status.temFimAulasDefinido,
          podeAdicionarEventos: status.podeAdicionarEventos,
          podeContabilizarDiasLetivos:
            status.temInicioAulasDefinido && status.temFimAulasDefinido,
          proximoEventoObrigatorio: status.proximoEventoObrigatorio,
        },
      };
    }

    // Verificar se pode contabilizar dias letivos (precisa das datas de aulas)
    const podeContabilizarDiasLetivos =
      status.temInicioAulasDefinido && status.temFimAulasDefinido;

    if (
      !podeContabilizarDiasLetivos ||
      !status.dataInicioAulas ||
      !status.dataFimAulas
    ) {
      return {
        diasTotais: null,
        diasLetivos: null,
        sabadosLetivos: null,
        feriados: null,
        domingos: null,
        eventos: eventos.length,
        feriadosEventos: eventos.filter((e) => e.reduzDiaLetivo).length,
        dataInicioAnoLetivo: status.dataInicioAnoLetivo,
        dataFimAnoLetivo: status.dataFimAnoLetivo,
        dataInicioAulas: status.dataInicioAulas,
        dataFimAulas: status.dataFimAulas,
        status: {
          temInicioDefinido: status.temInicioDefinido,
          temFimDefinido: status.temFimDefinido,
          temInicioAulasDefinido: status.temInicioAulasDefinido,
          temFimAulasDefinido: status.temFimAulasDefinido,
          podeAdicionarEventos: status.podeAdicionarEventos,
          podeContabilizarDiasLetivos: false,
          proximoEventoObrigatorio: status.proximoEventoObrigatorio,
        },
      };
    }

    // Calcular dias entre dataInicioAulas e dataFimAulas (período das aulas regulares)
    const dataInicio = new Date(status.dataInicioAulas);
    const dataFim = new Date(status.dataFimAulas);

    let diasLetivos = 0;
    let diasTotais = 0;
    let sabadosLetivos = 0;
    let feriados = 0;

    // Mapear sábados letivos e eventos que reduzem dias
    const sabadosLetivosSet = new Set<string>();
    const diasReduzidosSet = new Set<string>();

    eventos.forEach((evento) => {
      if (evento.tipo === "SABADO_LETIVO") {
        // Adiciona todos os sábados do intervalo do evento
        let current = new Date(evento.dataInicio);
        const end = evento.dataFim ? new Date(evento.dataFim) : current;
        while (current <= end) {
          if (current.getDay() === 6) {
            // Sábado
            sabadosLetivosSet.add(current.toISOString().split("T")[0]);
          }
          current.setDate(current.getDate() + 1);
        }
      }

      if (evento.reduzDiaLetivo) {
        // Adiciona todos os dias do intervalo do evento
        let current = new Date(evento.dataInicio);
        const end = evento.dataFim ? new Date(evento.dataFim) : current;
        while (current <= end) {
          diasReduzidosSet.add(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    // Iterar por cada dia do período de aulas
    const current = new Date(dataInicio);
    while (current <= dataFim) {
      diasTotais++;
      const dayOfWeek = current.getDay();
      const dateStr = current.toISOString().split("T")[0];

      // Domingos nunca são letivos
      if (dayOfWeek === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Sábados só são letivos se estiverem marcados como sábado letivo
      if (dayOfWeek === 6) {
        if (sabadosLetivosSet.has(dateStr)) {
          sabadosLetivos++;
          if (!diasReduzidosSet.has(dateStr)) {
            diasLetivos++;
          }
        }
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Dias úteis (segunda a sexta)
      if (diasReduzidosSet.has(dateStr)) {
        feriados++;
      } else {
        diasLetivos++;
      }

      current.setDate(current.getDate() + 1);
    }

    // Contar feriados (eventos que reduzem dia letivo)
    const feriadosEventos = eventos.filter((e) => e.reduzDiaLetivo);

    return {
      diasTotais,
      diasLetivos,
      sabadosLetivos,
      feriados,
      domingos: Math.floor(diasTotais / 7),
      eventos: eventos.length,
      feriadosEventos: feriadosEventos.length,
      dataInicioAnoLetivo: status.dataInicioAnoLetivo,
      dataFimAnoLetivo: status.dataFimAnoLetivo,
      dataInicioAulas: status.dataInicioAulas,
      dataFimAulas: status.dataFimAulas,
      status: {
        temInicioDefinido: status.temInicioDefinido,
        temFimDefinido: status.temFimDefinido,
        temInicioAulasDefinido: status.temInicioAulasDefinido,
        temFimAulasDefinido: status.temFimAulasDefinido,
        podeAdicionarEventos: status.podeAdicionarEventos,
        podeContabilizarDiasLetivos: true,
        proximoEventoObrigatorio: status.proximoEventoObrigatorio,
      },
    };
  }

  async getEventosPorMes(
    anoLetivoId: string,
    mes: number,
    ano: number,
    escolaId?: string
  ) {
    const startOfMonth = new Date(ano, mes - 1, 1);
    const endOfMonth = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Condição base de datas
    const dateCondition = [
      // Eventos que começam no mês
      {
        dataInicio: { gte: startOfMonth, lte: endOfMonth },
      },
      // Eventos que terminam no mês
      {
        dataFim: { gte: startOfMonth, lte: endOfMonth },
      },
      // Eventos que abrangem todo o mês
      {
        AND: [
          { dataInicio: { lte: startOfMonth } },
          { dataFim: { gte: endOfMonth } },
        ],
      },
    ];

    if (escolaId) {
      // Com escolaId: retorna eventos globais + eventos específicos da escola
      return prisma.eventoCalendario.findMany({
        where: {
          anoLetivoId,
          OR: dateCondition,
          AND: [
            {
              OR: [{ escolaId: null }, { escolaId }],
            },
          ],
        },
        include: {
          escola: true,
        },
        orderBy: { dataInicio: "asc" },
      });
    }

    // Sem escolaId: retorna apenas eventos globais
    return prisma.eventoCalendario.findMany({
      where: {
        anoLetivoId,
        escolaId: null,
        OR: dateCondition,
      },
      include: {
        escola: true,
      },
      orderBy: { dataInicio: "asc" },
    });
  }
}

export const calendarioService = new CalendarioService();
