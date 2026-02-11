'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useEscolas,
  useMatriculas,
  useProfissionais,
  useTurmas,
  useModules,
  useVagasResumo,
  useEtapas,
} from '@/hooks/useApi'
import {
  Buildings,
  Student,
  Users,
  Chalkboard,
  ChartBar,
  Warning,
} from '@phosphor-icons/react'
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
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  ATIVA: '#22c55e',
  AGUARDANDO_VAGA: '#f59e0b',
  TRANSFERIDA: '#3b82f6',
  CANCELADA: '#ef4444',
  CONCLUIDA: '#8b5cf6',
}

const STATUS_LABELS: Record<string, string> = {
  ATIVA: 'Ativas',
  AGUARDANDO_VAGA: 'Aguardando',
  TRANSFERIDA: 'Transferidas',
  CANCELADA: 'Canceladas',
  CONCLUIDA: 'Concluidas',
}

export function OverviewTab() {
  const anoLetivo = new Date().getFullYear()

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas()
  const { data: matriculas = [], isLoading: loadingMatriculas } = useMatriculas({ anoLetivo })
  const { data: profissionais = [], isLoading: loadingProfissionais } = useProfissionais()
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo })
  const { data: modules = [], isLoading: loadingModules } = useModules()
  const { data: vagasResumo = [], isLoading: loadingVagas } = useVagasResumo(undefined, anoLetivo)
  const { data: etapas = [] } = useEtapas()

  const isLoading = loadingEscolas || loadingMatriculas || loadingProfissionais || loadingTurmas

  // Estatisticas calculadas
  const escolasAtivas = escolas.filter(e => e.ativo).length
  const matriculasAtivas = matriculas.filter(m => m.status === 'ATIVA').length
  const matriculasPCD = matriculas.filter(m => m.possuiDeficiencia).length
  const matriculasSemTurma = matriculas.filter(m => !m.turmaId).length
  const profissionaisAtivos = profissionais.filter(p => p.ativo).length
  const professores = profissionais.filter(p => p.tipo === 'PROFESSOR' && p.ativo).length
  const turmasAtivas = turmas.filter(t => t.ativo).length

  // Vagas
  const capacidadeTotal = vagasResumo.reduce((sum, v) => sum + v.capacidadeTotal, 0)
  const alunosTotal = vagasResumo.reduce((sum, v) => sum + v.alunosTotal, 0)
  const vagasDisponiveis = vagasResumo.reduce((sum, v) => sum + v.vagasDisponiveis, 0)
  const turmasLotadas = vagasResumo.reduce((sum, v) => sum + v.turmasLotadas, 0)
  const ocupacaoGeral = capacidadeTotal > 0 ? Math.round((alunosTotal / capacidadeTotal) * 100) : 0

  // Progresso do sistema
  const totalModules = modules.length
  const overallProgress = totalModules > 0
    ? Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / totalModules)
    : 0

  // Dados para graficos
  const matriculasPorEscola = vagasResumo.map(v => ({
    nome: v.escolaNome.length > 18 ? v.escolaNome.substring(0, 18) + '...' : v.escolaNome,
    matriculados: v.alunosTotal,
    capacidade: v.capacidadeTotal,
    vagas: v.vagasDisponiveis,
  }))

  const statusDistribuicao = Object.entries(
    matriculas.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#94a3b8',
  }))

  const turmasDistribuicao = (() => {
    const turnos: Record<string, { turmas: number; alunos: number }> = {}
    const turnoLabels: Record<string, string> = {
      MATUTINO: 'Matutino',
      VESPERTINO: 'Vespertino',
      NOTURNO: 'Noturno',
      INTEGRAL: 'Integral',
    }
    turmas.filter(t => t.ativo).forEach(t => {
      const label = turnoLabels[t.turno] || t.turno
      if (!turnos[label]) turnos[label] = { turmas: 0, alunos: 0 }
      turnos[label].turmas += 1
      turnos[label].alunos += t.matriculas?.length || 0
    })
    return Object.entries(turnos).map(([name, data]) => ({ name, ...data }))
  })()

  const matriculasPorEtapa = (() => {
    const etapaMap: Record<string, number> = {}
    matriculas.forEach(m => {
      const etapa = etapas.find(e => e.id === m.etapaId)
      const nome = etapa?.nome || 'Sem etapa'
      etapaMap[nome] = (etapaMap[nome] || 0) + 1
    })
    return Object.entries(etapaMap).map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      value,
    }))
  })()

  const ETAPA_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  function CardSkeleton() {
    return (
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </Card>
    )
  }

  function ChartSkeleton() {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Painel da Rede Municipal</h2>
        <p className="text-sm text-slate-500">Municipio de Ibirapitanga - Ano Letivo {anoLetivo}</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Alunos Matriculados</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{matriculasAtivas}</p>
                  <p className="text-xs text-slate-500">{matriculasPCD} PCD ({matriculasAtivas > 0 ? ((matriculasPCD / matriculasAtivas) * 100).toFixed(1) : 0}%)</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <Student className="h-6 w-6 text-blue-600" weight="fill" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Escolas Ativas</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{escolasAtivas}</p>
                  <p className="text-xs text-slate-500">{turmasAtivas} turmas no total</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <Buildings className="h-6 w-6 text-emerald-600" weight="fill" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Profissionais</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{profissionaisAtivos}</p>
                  <p className="text-xs text-slate-500">{professores} professores</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3">
                  <Users className="h-6 w-6 text-violet-600" weight="fill" />
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Ocupacao da Rede</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{ocupacaoGeral}%</p>
                  <p className="text-xs text-slate-500">{vagasDisponiveis} vagas disponiveis</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <ChartBar className="h-6 w-6 text-amber-600" weight="fill" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Alertas */}
      {!isLoading && (matriculasSemTurma > 0 || turmasLotadas > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {matriculasSemTurma > 0 && (
            <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Warning className="h-5 w-5 text-amber-600" weight="fill" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{matriculasSemTurma} aluno(s) sem turma</p>
                  <p className="text-xs text-amber-600">Acesse Cadastros &gt; Matriculas para vincular</p>
                </div>
              </div>
            </Card>
          )}
          {turmasLotadas > 0 && (
            <Card className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Warning className="h-5 w-5 text-red-600" weight="fill" />
                <div>
                  <p className="text-sm font-medium text-red-800">{turmasLotadas} turma(s) lotada(s)</p>
                  <p className="text-xs text-red-600">Capacidade maxima atingida</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Graficos - Linha 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Matriculas por Escola - Bar Chart */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Matriculas por Escola</h3>
          {loadingVagas ? (
            <ChartSkeleton />
          ) : matriculasPorEscola.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma escola com turmas</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={matriculasPorEscola} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="nome"
                  tick={{ fontSize: 11 }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="matriculados" fill="#3b82f6" name="Matriculados" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacidade" fill="#e2e8f0" name="Capacidade" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status das Matriculas - Pie Chart */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Status das Matriculas</h3>
          {loadingMatriculas ? (
            <ChartSkeleton />
          ) : statusDistribuicao.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma matricula registrada</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#94a3b8' }}
                >
                  {statusDistribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Graficos - Linha 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Turmas e Alunos por Turno */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Distribuicao por Turno</h3>
          {loadingTurmas ? (
            <ChartSkeleton />
          ) : turmasDistribuicao.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma turma cadastrada</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={turmasDistribuicao} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="turmas" fill="#8b5cf6" name="Turmas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alunos" fill="#3b82f6" name="Alunos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Matriculas por Etapa - Pie Chart */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Matriculas por Etapa de Ensino</h3>
          {loadingMatriculas ? (
            <ChartSkeleton />
          ) : matriculasPorEtapa.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma matricula registrada</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={matriculasPorEtapa}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#94a3b8' }}
                >
                  {matriculasPorEtapa.map((_, index) => (
                    <Cell key={`etapa-${index}`} fill={ETAPA_COLORS[index % ETAPA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Cards informativos - Linha 3 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ocupacao por Escola */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Ocupacao por Escola</h3>
          {loadingVagas ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : vagasResumo.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma escola com turmas cadastradas</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {vagasResumo.map(escola => {
                const ocupacao = escola.capacidadeTotal > 0
                  ? Math.round((escola.alunosTotal / escola.capacidadeTotal) * 100)
                  : 0
                return (
                  <div key={escola.escolaId} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 truncate max-w-[200px]">{escola.escolaNome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{escola.alunosTotal}/{escola.capacidadeTotal}</span>
                        <span className={`text-xs font-medium ${ocupacao >= 90 ? 'text-red-600' : ocupacao >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {ocupacao}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={ocupacao}
                      className={`h-2 ${ocupacao >= 90 ? '[&>div]:bg-red-500' : ocupacao >= 70 ? '[&>div]:bg-amber-500' : ''}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Equipe por Funcao */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Equipe por Funcao</h3>
          {loadingProfissionais ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { tipo: 'PROFESSOR', label: 'Professores', color: 'bg-blue-500' },
                { tipo: 'COORDENADOR', label: 'Coordenadores', color: 'bg-violet-500' },
                { tipo: 'DIRETOR', label: 'Diretores', color: 'bg-emerald-500' },
                { tipo: 'AUXILIAR', label: 'Auxiliares', color: 'bg-amber-500' },
              ].map(({ tipo, label, color }) => {
                const count = profissionais.filter(p => p.tipo === tipo && p.ativo).length
                const pct = profissionaisAtivos > 0 ? Math.round((count / profissionaisAtivos) * 100) : 0
                return (
                  <div key={tipo} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-sm text-slate-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{count}</span>
                      <span className="text-xs text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Progresso do Sistema */}
      {modules.length > 0 && (
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Progresso do Sistema</h3>
          {loadingModules ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Progresso geral</span>
                <span className="text-2xl font-semibold text-slate-900">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm rounded-lg border border-slate-100 p-3">
                    <span className="text-slate-600 truncate max-w-[180px]">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <Progress value={m.progress} className="h-1.5" />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{m.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
