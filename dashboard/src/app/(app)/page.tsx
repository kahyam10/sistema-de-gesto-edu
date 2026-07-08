"use client";

import Link from "next/link";
import { PageWrap } from "@/components/ui/page-wrap";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";
import { EmptyWidget } from "@/components/ui/empty-state";
import {
  useEscolas,
  useTurmas,
  useMatriculas,
  useProfissionais,
  useModules,
  useEtapas,
} from "@/hooks/useApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#1351B4", "#1F6FB2", "#A94B8C", "#D97706", "#3B86A8", "#5C7A4F"];

const COLORS = {
  brand: "#1351B4",
  info: "#1F6FB2",
  warning: "#D97706",
  danger: "#C8391F",
  success: "#0F8A5F",
  teal: "#3B86A8",
};

export default function DashboardPage() {
  const { data: etapas = [] } = useEtapas();
  const { data: escolas = [] } = useEscolas();
  const { data: turmas = [] } = useTurmas();
  const { data: matriculas = [] } = useMatriculas();
  const { data: profissionais = [] } = useProfissionais();
  const { data: modules = [] } = useModules();

  const matriculasAtivas = matriculas.filter((m) => m.status === "ATIVA");
  const escolasAtivas = escolas.filter((e) => e.ativo);
  const turmasAtivas = turmas.filter((t) => t.ativo);
  const profissionaisAtivos = profissionais.filter((p) => p.ativo);

  // ── Alertas reais derivados dos cadastros ──
  const escolasSemDiretor = escolasAtivas.filter((e) => !e.diretorId);
  const escolasSemCenso = escolasAtivas.filter((e) => !e.dadosCenso);
  const matriculasSemTurma = matriculasAtivas.filter((m) => !m.turmaId);
  const turmasSemProfessor = turmasAtivas.filter(
    (t) => (t.professores?.length ?? 0) === 0
  );

  const alertas: {
    tone: "danger" | "warning" | "info";
    icon: IconName;
    title: string;
    sub: string;
    href: string;
  }[] = [];
  if (escolasSemDiretor.length > 0)
    alertas.push({
      tone: "danger",
      icon: "building",
      title: "Escolas sem gestor definido",
      sub: `${escolasSemDiretor.length} escola(s) sem diretor vinculado`,
      href: "/cadastros/escolas",
    });
  if (matriculasSemTurma.length > 0)
    alertas.push({
      tone: "warning",
      icon: "userPlus",
      title: "Matrículas sem turma",
      sub: `${matriculasSemTurma.length} aluno(s) aguardando enturmação`,
      href: "/cadastros/matriculas",
    });
  if (escolasSemCenso.length > 0)
    alertas.push({
      tone: "warning",
      icon: "clipboard",
      title: "Censo escolar pendente",
      sub: `${escolasSemCenso.length} escola(s) sem questionário preenchido`,
      href: "/cadastros/escolas",
    });
  if (turmasSemProfessor.length > 0)
    alertas.push({
      tone: "info",
      icon: "users",
      title: "Turmas sem professor",
      sub: `${turmasSemProfessor.length} turma(s) sem docente vinculado`,
      href: "/cadastros/escolas",
    });

  // ── Ocupação por escola ──
  const ocupacaoEscolas = escolasAtivas
    .map((escola) => {
      const turmasDaEscola = turmasAtivas.filter((t) => t.escolaId === escola.id);
      const alunos = turmasDaEscola.reduce(
        (acc, t) => acc + (t.matriculas?.length ?? 0),
        0
      );
      const capacidade = turmasDaEscola.reduce(
        (acc, t) => acc + t.capacidadeMaxima,
        0
      );
      const pct = capacidade > 0 ? Math.round((alunos / capacidade) * 100) : 0;
      return { escola, turmas: turmasDaEscola.length, alunos, capacidade, pct };
    })
    .sort((a, b) => b.alunos - a.alunos);

  // ── Situação das matrículas ──
  const porStatus = [
    { label: "Ativas", status: "ATIVA", tone: "success" as const, c: COLORS.success },
    { label: "Transferidas", status: "TRANSFERIDA", tone: "info" as const, c: COLORS.info },
    { label: "Concluídas", status: "CONCLUIDA", tone: "neutral" as const, c: COLORS.teal },
    { label: "Canceladas", status: "CANCELADA", tone: "danger" as const, c: COLORS.danger },
  ].map((s) => ({
    ...s,
    n: matriculas.filter((m) => m.status === s.status).length,
  }));
  const maxStatus = Math.max(...porStatus.map((s) => s.n), 1);

  // ── Dados dos gráficos (Recharts) ──
  const chartOcupacao = ocupacaoEscolas.map((o) => ({
    name: o.escola.nome.replace(/^Escola Municipal /, "EM "),
    Alunos: o.alunos,
    Capacidade: o.capacidade,
  }));
  const chartEtapas = etapas
    .map((etapa) => ({
      name: etapa.nome,
      alunos: matriculasAtivas.filter((m) => m.etapaId === etapa.id).length,
    }))
    .filter((e) => e.alunos > 0);

  // ── Progresso do desenvolvimento (tracker real) ──
  const progresso = modules
    .map((m) => {
      const total = m.subModules?.length ?? 0;
      const done =
        m.subModules?.filter((s) => s.status === "completed").length ?? 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { m, total, done, pct };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <PageWrap
      title="Visão geral"
      breadcrumb={[{ label: "Início" }, { label: "Dashboard executivo" }]}
      subtitle="Rede municipal de ensino de Ibirapitanga em tempo real"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/cadastros/matriculas">
            <Icon name="userPlus" size={13} />
            Nova matrícula
          </Link>
        </Button>
      }
    >
      {/* KPIs (contagens reais) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Alunos matriculados"
          value={matriculasAtivas.length.toLocaleString("pt-BR")}
          color={COLORS.brand}
          icon="graduation"
        />
        <KpiCard
          label="Escolas ativas"
          value={escolasAtivas.length.toLocaleString("pt-BR")}
          color={COLORS.info}
          icon="building"
        />
        <KpiCard
          label="Turmas em funcionamento"
          value={turmasAtivas.length.toLocaleString("pt-BR")}
          color={COLORS.teal}
          icon="book"
        />
        <KpiCard
          label="Profissionais"
          value={profissionaisAtivos.length.toLocaleString("pt-BR")}
          color={COLORS.warning}
          icon="users"
        />
      </div>

      {/* Desenvolvimento + Alertas */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Progresso do desenvolvimento · módulos do sistema"
            headerRight={
              <Link href="/desenvolvimento" className="hover:text-ink transition-colors">
                Ver detalhes
              </Link>
            }
          >
            {progresso.length === 0 ? (
              <EmptyWidget icon="layers" label="Nenhum módulo cadastrado no tracker." />
            ) : (
              <div className="-my-1">
                {progresso.map(({ m, total, done, pct }, i) => (
                  <div
                    key={m.id}
                    className={
                      "grid grid-cols-[1fr_auto] items-center gap-2 py-3 " +
                      (i === progresso.length - 1 ? "" : "border-b border-hairline")
                    }
                  >
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-ink">{m.name}</span>
                        <span className="font-mono text-[11px] font-semibold text-ink-muted">
                          {done}/{total} submódulos
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-sm bg-surface-muted">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 60 ? COLORS.success : pct > 0 ? COLORS.info : COLORS.brand,
                          }}
                        />
                      </div>
                    </div>
                    <span className="ml-2 min-w-[42px] text-right font-display text-[18px] font-semibold tracking-[-0.3px] text-ink">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
        <Panel title="Alertas ativos">
          {alertas.length === 0 ? (
            <EmptyWidget icon="check" label="Nenhuma pendência na rede — tudo em dia." />
          ) : (
            <div className="-mt-2">
              {alertas.map((a, i) => (
                <AlertItem key={a.title} {...a} last={i === alertas.length - 1} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Ocupação por escola + Situação das matrículas */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel
            title="Ocupação por escola"
            headerRight={
              <Link href="/cadastros/escolas" className="hover:text-ink transition-colors">
                Ver escolas
              </Link>
            }
            pad={false}
          >
            {ocupacaoEscolas.length === 0 ? (
              <EmptyWidget icon="building" label="Nenhuma escola cadastrada." />
            ) : (
              <div className="overflow-x-auto">
                <OcupacaoTable rows={ocupacaoEscolas} />
              </div>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Matrículas por situação" pad={false}>
            <div>
              {porStatus.map((s, i) => (
                <div
                  key={s.status}
                  className={
                    "grid grid-cols-[1fr_auto] items-center gap-2 px-[18px] py-3 " +
                    (i === porStatus.length - 1 ? "" : "border-b border-hairline")
                  }
                >
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="text-[12.5px] font-medium text-ink">{s.label}</span>
                      <Badge variant={s.tone}>{s.status}</Badge>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-surface-muted">
                      <div
                        className="h-full"
                        style={{ width: `${(s.n / maxStatus) * 100}%`, background: s.c }}
                      />
                    </div>
                  </div>
                  <span className="ml-2 min-w-[26px] text-right font-display text-[18px] font-semibold tracking-[-0.3px] text-ink">
                    {s.n}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Gráficos (Recharts) */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Alunos × capacidade por escola">
            {chartOcupacao.length === 0 ? (
              <EmptyWidget icon="chart" label="Sem dados de ocupação para exibir." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartOcupacao} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="2 3" stroke="#E3E7E4" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10.5, fill: "#6B7872" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E3E7E4" }}
                    interval={0}
                    angle={-12}
                    height={44}
                  />
                  <YAxis
                    tick={{ fontSize: 10.5, fill: "#6B7872", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#FAFBFD" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E3E7E4",
                      fontSize: 12,
                      boxShadow: "0 1px 3px rgba(15,23,40,0.06)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11.5 }} />
                  <Bar dataKey="Alunos" fill="#1351B4" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Capacidade" fill="#A9CBFF" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Alunos por etapa de ensino">
            {chartEtapas.length === 0 ? (
              <EmptyWidget icon="graduation" label="Nenhuma matrícula ativa para agrupar por etapa." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartEtapas}
                    dataKey="alunos"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {chartEtapas.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E3E7E4",
                      fontSize: 12,
                      boxShadow: "0 1px 3px rgba(15,23,40,0.06)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11.5 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </div>
      </div>
    </PageWrap>
  );
}

function AlertItem({
  tone,
  icon,
  title,
  sub,
  href,
  last,
}: {
  tone: "danger" | "warning" | "info";
  icon: IconName;
  title: string;
  sub: string;
  href: string;
  last?: boolean;
}) {
  const palette = {
    danger: { fg: COLORS.danger, bg: "#FCEAE4" },
    warning: { fg: COLORS.warning, bg: "#FCEED2" },
    info: { fg: COLORS.info, bg: "#E2EEF8" },
  }[tone];
  return (
    <Link
      href={href}
      className={
        "group flex items-start gap-3 py-[11px] " + (last ? "" : "border-b border-hairline")
      }
    >
      <div
        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-md"
        style={{ background: palette.bg, color: palette.fg }}
      >
        <Icon name={icon} size={15} strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-ink tracking-[-0.05px]">{title}</div>
        <div className="mt-0.5 text-[11.5px] text-ink-muted">{sub}</div>
      </div>
      <Icon
        name="chevron"
        size={13}
        className="mt-1 text-ink-soft transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function OcupacaoTable({
  rows,
}: {
  rows: {
    escola: { id: string; nome: string };
    turmas: number;
    alunos: number;
    capacidade: number;
    pct: number;
  }[];
}) {
  const th =
    "border-b border-hairline px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.6px] text-ink-muted";
  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="bg-surface-alt">
          <th className={th + " w-[40%]"}>Escola</th>
          <th className={th}>Turmas</th>
          <th className={th}>Alunos</th>
          <th className={th + " w-[30%]"}>Ocupação</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const barColor =
            r.pct > 90 ? COLORS.danger : r.pct > 75 ? COLORS.warning : COLORS.success;
          return (
            <tr key={r.escola.id} className="border-t border-hairline">
              <td className="px-4 py-3 align-middle font-medium text-ink">
                <div className="flex items-center gap-2">
                  <Icon name="location" size={13} className="text-ink-muted shrink-0" />
                  <span className="truncate">{r.escola.nome}</span>
                </div>
              </td>
              <td className="px-4 py-3 align-middle font-mono font-semibold text-ink-2">
                {r.turmas}
              </td>
              <td className="px-4 py-3 align-middle font-mono font-semibold text-ink-2">
                {r.alunos}
              </td>
              <td className="px-4 py-3 align-middle">
                <div className="flex items-center gap-2">
                  <div className="h-1 min-w-[60px] flex-1 overflow-hidden rounded-sm bg-surface-muted">
                    <div
                      className="h-full"
                      style={{ width: `${Math.min(r.pct, 100)}%`, background: barColor }}
                    />
                  </div>
                  <span className="font-mono text-[12px] font-semibold text-ink-2">
                    {r.pct}%
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
