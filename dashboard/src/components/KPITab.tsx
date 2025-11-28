import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPI } from '@/lib/types'
import { TrendUp, Gauge, ChartBar } from '@phosphor-icons/react'

interface KPITabProps {
  kpis: KPI[]
}

const categoryLabels = {
  educational: 'Educacional',
  operational: 'Operacional',
  technical: 'Técnico'
}

const categoryColors = {
  educational: 'bg-accent text-accent-foreground',
  operational: 'bg-secondary text-secondary-foreground',
  technical: 'bg-primary text-primary-foreground'
}

export function KPITab({ kpis }: KPITabProps) {
  const educationalKPIs = kpis.filter(k => k.category === 'educational')
  const operationalKPIs = kpis.filter(k => k.category === 'operational')
  const technicalKPIs = kpis.filter(k => k.category === 'technical')

  const renderKPICard = (kpi: KPI) => (
    <Card key={kpi.id} className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg flex-1">{kpi.name}</h3>
          <Badge className={categoryColors[kpi.category]}>
            {categoryLabels[kpi.category]}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{kpi.description}</p>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Meta</p>
            <p className="text-2xl font-bold text-primary">
              {kpi.target}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Atual</p>
            <p className="text-2xl font-bold text-foreground">
              {kpi.current}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Indicadores de Sucesso (KPIs)</h2>
        <p className="text-muted-foreground">
          Métricas para avaliar o impacto e efetividade do sistema
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-accent/10 to-secondary/10 border-2">
        <div className="flex items-start gap-4">
          <TrendUp className="text-accent flex-shrink-0" size={40} weight="bold" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Sobre os Indicadores</h3>
            <p className="text-sm text-muted-foreground">
              Os KPIs abaixo foram definidos para medir o sucesso do sistema em três dimensões:
              impacto educacional direto, eficiência operacional e performance técnica.
              Estes indicadores devem ser monitorados continuamente após a implementação.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="text-accent" size={24} weight="fill" />
          <h3 className="text-xl font-semibold">Indicadores Educacionais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {educationalKPIs.map(renderKPICard)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <ChartBar className="text-secondary" size={24} weight="fill" />
          <h3 className="text-xl font-semibold">Indicadores Operacionais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operationalKPIs.map(renderKPICard)}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="text-primary" size={24} weight="fill" />
          <h3 className="text-xl font-semibold">Indicadores Técnicos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {technicalKPIs.map(renderKPICard)}
        </div>
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold text-lg mb-4">Metodologia de Medição</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Coleta de Dados</p>
            <p className="text-muted-foreground">
              Indicadores são calculados automaticamente pelo sistema com base em dados reais
              de uso, integrando informações de múltiplos módulos.
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Frequência de Atualização</p>
            <p className="text-muted-foreground">
              Indicadores educacionais: mensal | Operacionais: semanal | Técnicos: tempo real
            </p>
          </div>
          <div>
            <p className="font-medium mb-1">Revisão de Metas</p>
            <p className="text-muted-foreground">
              As metas devem ser revisadas trimestralmente pela SEMEC com base em tendências
              e contexto municipal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
