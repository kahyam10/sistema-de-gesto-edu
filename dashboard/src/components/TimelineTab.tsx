import { Phase, Module } from '@/lib/types'
import { PhaseCard } from './PhaseCard'

interface TimelineTabProps {
  phases: Phase[]
  modules: Module[]
}

export function TimelineTab({ phases, modules }: TimelineTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Cronograma de Implementação</h2>
        <p className="text-muted-foreground">
          4 fases distribuídas ao longo de 12 meses
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {phases.map((phase, index) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            modules={modules}
            isLast={index === phases.length - 1}
          />
        ))}
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
        <h3 className="font-semibold text-lg mb-4">Notas sobre Implementação</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Fase 1 (Fundação):</strong> Estabelece a base com matrículas e RH, essencial para operação básica
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Fase 2 (Núcleo Pedagógico):</strong> Implementa o coração do sistema com gestão pedagógica e portais
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Fase 3 (Gestão):</strong> Adiciona ferramentas de gestão democrática e administrativa
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">•</span>
            <span>
              <strong>Fase 4 (Expansão):</strong> Completa o sistema com programas especiais e serviços auxiliares
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
