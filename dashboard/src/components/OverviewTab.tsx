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
} from '@/hooks/useApi'
import {
  Buildings,
  Student,
  Users,
  Chalkboard,
  ChartBar,
  Warning,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Spinner,
} from '@phosphor-icons/react'

export function OverviewTab() {
  const anoLetivo = new Date().getFullYear()

  const { data: escolas = [], isLoading: loadingEscolas } = useEscolas()
  const { data: matriculas = [], isLoading: loadingMatriculas } = useMatriculas({ anoLetivo })
  const { data: profissionais = [], isLoading: loadingProfissionais } = useProfissionais()
  const { data: turmas = [], isLoading: loadingTurmas } = useTurmas({ anoLetivo })
  const { data: modules = [], isLoading: loadingModules } = useModules()
  const { data: vagasResumo = [], isLoading: loadingVagas } = useVagasResumo(undefined, anoLetivo)

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

  // Alunos por turno
  const turnosCount = turmas.reduce((acc, t) => {
    acc[t.turno] = (acc[t.turno] || 0) + (t.matriculas?.length || 0)
    return acc
  }, {} as Record<string, number>)

  const turnoLabels: Record<string, string> = {
    MATUTINO: 'Matutino',
    VESPERTINO: 'Vespertino',
    NOTURNO: 'Noturno',
    INTEGRAL: 'Integral',
  }

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

        {/* Distribuicao de Profissionais */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Turmas por Turno */}
        <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Turmas por Turno</h3>
          {loadingTurmas ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL'].map(turno => {
                const turmasDoTurno = turmas.filter(t => t.turno === turno && t.ativo)
                if (turmasDoTurno.length === 0) return null
                return (
                  <div key={turno} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <span className="text-sm text-slate-700">{turnoLabels[turno] || turno}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400">{turmasDoTurno.length} turmas</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Progresso do Sistema */}
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
          ) : modules.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum modulo cadastrado</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500">Progresso geral</span>
                <span className="text-2xl font-semibold text-slate-900">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2 mb-4" />
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {modules.slice(0, 6).map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 truncate max-w-[200px]">{m.name}</span>
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
      </div>
    </div>
  )
}
