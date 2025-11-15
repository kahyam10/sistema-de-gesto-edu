import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  escolasMockadas, 
  etapasMockadas, 
  turmasMockadas, 
  matriculasMockadas,
  gerarEstatisticasTurmas,
  gerarEstatisticasEscolas,
  gerarResumoGeral
} from '@/lib/mockData'
import { 
  GraduationCap, 
  Users, 
  Buildings, 
  ChalkboardTeacher,
  UsersFour,
  ChartBar,
  Student,
  CheckCircle,
  Warning,
  Download,
  Trash
} from '@phosphor-icons/react'
import { Escola, EtapaEnsino, Turma, Matricula } from '@/lib/types'

export function MockDataTab() {
  const [activeSubTab, setActiveSubTab] = useState('resumo')
  const [escolas, setEscolas] = useKV<Escola[]>('schools', [])
  const [etapas, setEtapas] = useKV<EtapaEnsino[]>('school-etapas', [])
  const [turmas, setTurmas] = useKV<Turma[]>('school-turmas', [])
  const [matriculas, setMatriculas] = useKV<Matricula[]>('student-enrollments', [])
  
  const resumoGeral = gerarResumoGeral()
  const estatisticasEscolas = gerarEstatisticasEscolas()
  const estatisticasTurmas = gerarEstatisticasTurmas()

  const dadosJaImportados = (escolas || []).length > 0 || (matriculas || []).length > 0

  const handleImportarDados = () => {
    setEtapas(() => etapasMockadas)
    setEscolas(() => escolasMockadas)
    setTurmas(() => turmasMockadas)
    setMatriculas(() => matriculasMockadas)
    
    toast.success('Dados importados com sucesso!', {
      description: `${escolasMockadas.length} escolas, ${turmasMockadas.length} turmas e ${matriculasMockadas.length} matrículas foram adicionadas ao sistema.`
    })
  }

  const handleLimparDados = () => {
    setEscolas(() => [])
    setEtapas(() => [])
    setTurmas(() => [])
    setMatriculas(() => [])
    
    toast.success('Dados limpos com sucesso!', {
      description: 'Todos os dados foram removidos do sistema.'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dados Mockados do Sistema</h2>
          <p className="text-muted-foreground">
            Visualização dos dados gerados para teste e desenvolvimento
          </p>
        </div>
        <div className="flex gap-2">
          {dadosJaImportados && (
            <Button variant="destructive" onClick={handleLimparDados}>
              <Trash size={18} className="mr-2" />
              Limpar Dados
            </Button>
          )}
          <Button onClick={handleImportarDados}>
            <Download size={18} className="mr-2" />
            {dadosJaImportados ? 'Reimportar Dados' : 'Importar Dados'}
          </Button>
        </div>
      </div>

      {!dadosJaImportados && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="text-primary" size={24} weight="fill" />
              <div>
                <CardTitle className="text-primary">Dados Prontos para Importação</CardTitle>
                <CardDescription>
                  Clique no botão "Importar Dados" acima para adicionar 200 alunos, 6 escolas e turmas ao sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
              <Buildings className="text-primary" size={20} weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoGeral.totalEscolas}</div>
            <p className="text-xs text-muted-foreground mt-1">Em operação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Turmas Criadas</CardTitle>
              <ChalkboardTeacher className="text-secondary" size={20} weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoGeral.totalTurmas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média {resumoGeral.mediaAlunosPorTurma} alunos/turma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Alunos Matriculados</CardTitle>
              <UsersFour className="text-accent" size={20} weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoGeral.totalAlunos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em todas as escolas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Alunos PCD</CardTitle>
              <Student className="text-primary" size={20} weight="fill" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{resumoGeral.totalPCD}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumoGeral.percentualPCD}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {resumoGeral.turmasViolandoLimitePCD > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="text-destructive" size={24} weight="fill" />
              <div>
                <CardTitle className="text-destructive">Alerta: Limite PCD Excedido</CardTitle>
                <CardDescription>
                  {resumoGeral.turmasViolandoLimitePCD} turma(s) excederam o limite de alunos PCD
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumo">
            <ChartBar size={16} className="mr-2" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="escolas">
            <Buildings size={16} className="mr-2" />
            Escolas
          </TabsTrigger>
          <TabsTrigger value="turmas">
            <ChalkboardTeacher size={16} className="mr-2" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="alunos">
            <Users size={16} className="mr-2" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="etapas">
            <GraduationCap size={16} className="mr-2" />
            Etapas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Escola</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {estatisticasEscolas.map(estat => (
                    <div key={estat.escola.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{estat.escola.nome}</h3>
                        <p className="text-sm text-muted-foreground">{estat.escola.codigo}</p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-lg">{estat.totalTurmas}</div>
                          <div className="text-muted-foreground">Turmas</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg">{estat.totalAlunos}</div>
                          <div className="text-muted-foreground">Alunos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-primary">{estat.totalPCD}</div>
                          <div className="text-muted-foreground">PCD</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escolas">
          <Card>
            <CardHeader>
              <CardTitle>Escolas Cadastradas ({escolasMockadas.length})</CardTitle>
              <CardDescription>Lista completa de escolas do município</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Etapas</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escolasMockadas.map(escola => (
                      <TableRow key={escola.id}>
                        <TableCell className="font-medium">{escola.codigo}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{escola.nome}</div>
                            <div className="text-sm text-muted-foreground">{escola.endereco}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{escola.telefone}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {escola.etapasVinculadas.map(etapaId => {
                              const etapa = etapasMockadas.find(e => e.id === etapaId)
                              return etapa ? (
                                <Badge key={etapaId} variant="secondary" className="text-xs">
                                  {etapa.nome}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {escola.ativa ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle size={12} className="mr-1" /> Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turmas">
          <Card>
            <CardHeader>
              <CardTitle>Turmas Criadas ({turmasMockadas.length})</CardTitle>
              <CardDescription>Distribuição de turmas por escola e série</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escola</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead className="text-center">Alunos</TableHead>
                      <TableHead className="text-center">PCD</TableHead>
                      <TableHead className="text-center">Vagas</TableHead>
                      <TableHead className="text-center">Ocupação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estatisticasTurmas.map(estat => {
                      const escola = escolasMockadas.find(e => e.id === estat.turma.escolaId)
                      const violaLimite = estat.totalPCD > estat.turma.limitePCD
                      
                      return (
                        <TableRow key={estat.turma.id} className={violaLimite ? 'bg-destructive/10' : ''}>
                          <TableCell className="text-sm">{escola?.codigo}</TableCell>
                          <TableCell className="font-medium">{estat.turma.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {estat.turma.turno}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {estat.totalAlunos}/{estat.turma.capacidadeMaxima}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={violaLimite ? 'text-destructive font-bold' : ''}>
                              {estat.totalPCD}/{estat.turma.limitePCD}
                            </span>
                            {violaLimite && <Warning size={14} className="inline ml-1 text-destructive" weight="fill" />}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {estat.vagasDisponiveis}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${estat.percentualOcupacao >= 90 ? 'bg-destructive' : estat.percentualOcupacao >= 70 ? 'bg-accent' : 'bg-primary'}`}
                                  style={{ width: `${estat.percentualOcupacao}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-10">{estat.percentualOcupacao}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alunos">
          <Card>
            <CardHeader>
              <CardTitle>Alunos Matriculados ({matriculasMockadas.length})</CardTitle>
              <CardDescription>Lista de todas as matrículas ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Turma</TableHead>
                      <TableHead>Data Nasc.</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>PCD</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matriculasMockadas.map(matricula => {
                      const escola = escolasMockadas.find(e => e.id === matricula.escolaId)
                      const turma = turmasMockadas.find(t => t.id === matricula.turmaId)
                      
                      return (
                        <TableRow key={matricula.id}>
                          <TableCell className="font-medium">{matricula.nomeAluno}</TableCell>
                          <TableCell className="text-sm">{escola?.codigo}</TableCell>
                          <TableCell className="text-sm">{turma?.nome}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(matricula.dataNascimento).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm">{matricula.nomeResponsavel}</TableCell>
                          <TableCell>
                            {matricula.necessidadesEspeciais ? (
                              <Badge variant="secondary" className="text-xs">
                                <Student size={12} className="mr-1" weight="fill" />
                                {matricula.descricaoNecessidades}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <Card>
            <CardHeader>
              <CardTitle>Etapas de Ensino ({etapasMockadas.length})</CardTitle>
              <CardDescription>Estrutura de séries por etapa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {etapasMockadas.map(etapa => (
                  <div key={etapa.id} className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{etapa.nome}</h3>
                      <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {etapa.series.map(serie => {
                        const turmasDaSerie = turmasMockadas.filter(t => t.serieId === serie.id)
                        const alunosDaSerie = matriculasMockadas.filter(m => m.serieId === serie.id)
                        
                        return (
                          <div key={serie.id} className="border rounded p-3 min-w-[120px]">
                            <div className="font-medium">{serie.nome}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {turmasDaSerie.length} turmas
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {alunosDaSerie.length} alunos
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
