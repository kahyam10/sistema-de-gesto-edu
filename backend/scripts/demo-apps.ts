/**
 * Dados de DEMONSTRAÇÃO (100% fictícios) para testar os apps de pais e
 * professores ponta a ponta no ambiente de DEV. Nunca rode em produção.
 *
 *   docker compose -f docker-compose.dev.yml exec -T backend \
 *     npx tsx scripts/demo-apps.ts > /tmp/gestao-edu-demo-senha
 *
 * Cria uma escola "(demo)" com turma, 8 alunos, professor, responsável,
 * frequência, notas, agenda, cardápio, comunicados e notificações.
 * Usuários: prof.e2e@teste.local e pais.e2e@teste.local.
 * A senha é gerada na hora e sai SOMENTE no stdout (redirecione para um
 * arquivo); o resto do log vai para o stderr. Se a escola demo já existe,
 * não altera nada.
 */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prismaSemEscopo as prisma } from "../src/lib/prisma.js";

const log = (...m: unknown[]) => console.error("[demo-apps]", ...m);
const DIA = 24 * 60 * 60 * 1000;
const DIAS = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];
const NOMES = [
  "Alice Ferreira", "Arthur Santos", "Beatriz Oliveira", "Caio Pereira",
  "Davi Almeida", "Eduarda Costa", "Enzo Rodrigues", "Gabriela Lima",
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Script de demonstração não roda em produção.");
  if (await prisma.escola.findUnique({ where: { codigo: "DEMO-APPS" } })) {
    log("A escola demo já existe; nada foi alterado. Use a senha gerada na primeira execução.");
    process.exitCode = 2;
    return;
  }

  const hoje = new Date(new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bahia" }).format(new Date()));
  const emDias = (n: number) => new Date(hoje.getTime() + n * DIA);
  const ano = hoje.getUTCFullYear();

  const tipo = await prisma.tipoEducacao.create({ data: { nome: "Regular (demo)" } });
  const etapa = await prisma.etapaEnsino.create({ data: { nome: "Ensino Fundamental (demo)", tipoEducacaoId: tipo.id } });
  const nivel = await prisma.nivelEnsino.create({ data: { nome: "Anos Iniciais (demo)", etapaId: etapa.id } });
  const serie = await prisma.serie.create({ data: { nome: "5º ano (demo)", nivelId: nivel.id } });
  const disciplinas = await Promise.all(
    [["Língua Portuguesa", "LP-DEMO", 1], ["Matemática", "MAT-DEMO", 2], ["Ciências", "CIE-DEMO", 3]].map(([nome, codigo, ordem]) =>
      prisma.disciplina.create({ data: { nome: nome as string, codigo: codigo as string, ordem: ordem as number, etapaId: etapa.id } })
    )
  );
  const escola = await prisma.escola.create({
    data: {
      nome: "Escola Municipal Demonstração", codigo: "DEMO-APPS",
      telefone: "(00) 0000-0000", email: "secretaria@escola-demo.test", endereco: "Rua Fictícia, 100 — Centro",
    },
  });
  const turma = await prisma.turma.create({
    data: { nome: "5º A", turno: "MATUTINO", anoLetivo: ano, escolaId: escola.id, serieId: serie.id },
  });
  const alunos = [];
  for (const [i, nome] of NOMES.entries()) {
    alunos.push(
      await prisma.matricula.create({
        data: {
          anoLetivo: ano, status: "ATIVA", dataNascimento: new Date("2015-05-10"), sexo: i % 2 ? "M" : "F",
          nomeResponsavel: "Responsável (demo)", escolaId: escola.id, etapaId: etapa.id, turmaId: turma.id,
          numeroMatricula: `DEMO${String(i + 1).padStart(5, "0")}`, nomeAluno: `${nome} (demo)`,
        },
      })
    );
  }
  const profissional = await prisma.profissionalEducacao.create({
    data: { nome: "Carlos Lima (demo)", cpf: "00000000949", tipo: "PROFESSOR" },
  });
  await prisma.turmaProfessor.create({
    data: { turmaId: turma.id, profissionalId: profissional.id, tipo: "PROFESSOR", disciplina: "Língua Portuguesa" },
  });
  // Aula todo dia útil, para a tela "Hoje" sempre ter chamada
  await prisma.gradeHoraria.createMany({
    data: DIAS.slice(1, 6).map((diaSemana) => ({
      diaSemana, horaInicio: "07:30", horaFim: "09:10", disciplina: "Língua Portuguesa",
      turmaId: turma.id, profissionalId: profissional.id,
    })),
  });

  // Frequência dos últimos 30 dias úteis (hoje fica pendente de propósito)
  const registros = [];
  for (let d = 1, uteis = 0; uteis < 30; d++) {
    const data = emDias(-d);
    if ([0, 6].includes(data.getUTCDay())) continue;
    uteis++;
    for (const [i, a] of alunos.entries()) {
      const falta = (i === 4 && uteis % 3 === 0) || (i === 1 && uteis % 11 === 0);
      registros.push({ matriculaId: a.id, turmaId: turma.id, data, status: falta ? (uteis % 2 ? "FALTA" : "JUSTIFICADA") : "PRESENTE" });
    }
  }
  await prisma.frequencia.createMany({ data: registros });

  // Avaliações e notas dos bimestres 1 a 3
  const base = [8.5, 7, 9, 6.5, 10, 7.5, 8, 5.5];
  for (const [di, disc] of disciplinas.entries()) {
    for (const bim of [1, 2, 3]) {
      const av = await prisma.avaliacao.create({
        data: {
          nome: `Prova ${bim}º bimestre — ${disc.nome}`, tipo: "PROVA", bimestre: bim, peso: 1, valorMaximo: 10,
          data: emDias(-(4 - bim) * 60), turmaId: turma.id, disciplinaId: disc.id, profissionalId: profissional.id,
        },
      });
      await prisma.nota.createMany({
        data: alunos.map((a, i) => ({
          valor: base[(i + di + bim) % base.length], turmaId: turma.id, disciplina: disc.nome, bimestre: bim,
          avaliacaoId: av.id, matriculaId: a.id,
        })),
      });
    }
  }

  // Agenda, cardápio e comunicados
  const anoLetivo = await prisma.anoLetivo.upsert({ where: { ano }, update: {}, create: { ano } });
  await prisma.eventoCalendario.createMany({
    data: [
      { titulo: "Semana da leitura (demo)", tipo: "EVENTO", escopo: "ESCOLA", dataInicio: emDias(3), dataFim: emDias(7), anoLetivoId: anoLetivo.id, escolaId: escola.id },
      { titulo: "Feriado municipal (demo)", tipo: "FERIADO", dataInicio: emDias(12), anoLetivoId: anoLetivo.id, escolaId: escola.id },
    ],
  });
  await prisma.reuniaoPais.create({
    data: {
      escolaId: escola.id, turmaId: turma.id, titulo: "Reunião de pais do 3º bimestre (demo)", data: emDias(6),
      horario: "08:00", duracao: 90, local: "Pátio da escola", tipo: "BIMESTRAL", finalidade: "Entrega dos resultados do bimestre",
    },
  });
  await prisma.plantaoPedagogico.create({
    data: { escolaId: escola.id, data: emDias(9), tipo: "COLETIVO", horarioInicio: "14:00", horarioFim: "17:00", local: "Sala da coordenação" },
  });
  const pratos = ["Cuscuz com ovo e suco", "Arroz, feijão e frango", "Mingau de tapioca", "Sopa de legumes", "Macarrão com carne moída"];
  await prisma.cardapio.createMany({
    data: pratos.map((descricao, i) => ({
      data: emDias(i), turno: "MATUTINO", tipoRefeicao: "LANCHE_MANHA", descricao: `${descricao} (demo)`, escolaId: escola.id,
    })),
  });
  const comPais = await prisma.comunicado.create({
    data: {
      titulo: "Reunião de pais do 3º bimestre (demo)", tipo: "CONVITE", destinatarios: "PAIS", autorNome: "Coordenação (demo)",
      escolaId: escola.id, destaque: true,
      mensagem: "Convidamos as famílias para a reunião de entrega dos resultados do bimestre.\n\nConfirme abaixo que você recebeu este aviso.",
    },
  });
  await prisma.comunicado.create({
    data: {
      titulo: "Planejamento pedagógico (demo)", tipo: "AVISO", destinatarios: "PROFESSORES", autorNome: "Direção (demo)",
      escolaId: escola.id, mensagem: "Na próxima sexta haverá planejamento coletivo após as aulas.",
    },
  });

  // Usuários de teste (senha aleatória, só no stdout)
  const senha = randomBytes(12).toString("base64url");
  const hash = await bcrypt.hash(senha, 10);
  const prof = await prisma.user.create({
    data: { email: "prof.e2e@teste.local", nome: "Carlos Lima (demo)", role: "PROFESSOR", password: hash, profissionalId: profissional.id },
  });
  const pais = await prisma.user.create({
    data: { email: "pais.e2e@teste.local", nome: "Maria Souza (demo)", role: "RESPONSAVEL", password: hash },
  });
  await prisma.matriculaUsuario.createMany({
    data: [
      { matriculaId: alunos[0].id, userId: pais.id, parentesco: "Mãe" },
      { matriculaId: alunos[4].id, userId: pais.id, parentesco: "Mãe" },
    ],
  });
  await prisma.notificacao.createMany({
    data: [
      { userId: pais.id, titulo: "Novo comunicado da escola", mensagem: "Há um convite para a reunião de pais.", tipo: "COMUNICADO", canais: ["APP"], acaoTipo: "VISUALIZAR_COMUNICADO", acaoId: comPais.id },
      { userId: pais.id, titulo: "Notas do 3º bimestre lançadas", mensagem: "O boletim foi atualizado.", tipo: "ACADEMICO", canais: ["APP"] },
      { userId: prof.id, titulo: "Chamada pendente", mensagem: "A chamada de hoje do 5º A ainda não foi registrada.", tipo: "LEMBRETE", prioridade: "ALTA", canais: ["APP"] },
    ],
  });

  log("Pronto: escola DEMO-APPS, usuários prof.e2e@teste.local e pais.e2e@teste.local.");
  process.stdout.write(`${senha}\n`);
}

main()
  .catch((e) => {
    log(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
