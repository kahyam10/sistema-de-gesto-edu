import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TechStack } from '@/lib/types'
import { 
  Code, FileCode, Palette, Database, 
  Package, Key, Shield, HardDrive, CheckCircle, TestTube,
  FileText, Cloud, FolderOpen, MagnifyingGlass, Lightning, Cpu
} from '@phosphor-icons/react'

interface TechStackTabProps {
  techStack: TechStack[]
}

const iconMap: Record<string, any> = {
  Code, FileCode, Palette, Server: Cpu, Zap: Lightning, Database,
  Box: Package, Key, Shield, HardDrive, CheckCircle, TestTube,
  FileText, Cloud, FolderOpen, FileSearch: MagnifyingGlass
}

export function TechStackTab({ techStack }: TechStackTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Especificações Técnicas</h2>
        <p className="text-muted-foreground">
          Stack tecnológico recomendado para o desenvolvimento
        </p>
      </div>

      <div className="space-y-6">
        {techStack.map((category) => (
          <Card key={category.category} className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {category.category}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => {
                const Icon = iconMap[item.icon]
                return (
                  <div
                    key={item.name}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    {Icon && <Icon className="text-primary flex-shrink-0 mt-0.5" size={24} />}
                    <div>
                      <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-primary/5 border-2 border-primary/20">
        <h3 className="font-semibold text-lg mb-4">Requisitos de Segurança</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Shield className="text-primary flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div>
              <p className="font-medium">Conformidade com LGPD</p>
              <p className="text-muted-foreground text-xs">
                Proteção de dados pessoais e sensíveis
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Key className="text-primary flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div>
              <p className="font-medium">Criptografia de Dados</p>
              <p className="text-muted-foreground text-xs">
                Informações sensíveis sempre encriptadas
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <HardDrive className="text-primary flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div>
              <p className="font-medium">Backup Automático</p>
              <p className="text-muted-foreground text-xs">
                Cópias diárias com redundância
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MagnifyingGlass className="text-primary flex-shrink-0 mt-0.5" size={20} weight="fill" />
            <div>
              <p className="font-medium">Logs de Auditoria</p>
              <p className="text-muted-foreground text-xs">
                Rastreamento completo de ações
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Integrações Necessárias</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">→</span>
            <span>
              <strong>Sistema Presença (Governo Federal):</strong> Registro de frequência integrado
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">→</span>
            <span>
              <strong>Censo Escolar (MEC/INEP):</strong> Exportação de dados educacionais
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">→</span>
            <span>
              <strong>FNDE (PNAE/PNATE):</strong> Relatórios de alimentação e transporte escolar
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent font-bold">→</span>
            <span>
              <strong>SMS/Email/Push:</strong> Notificações multicanal para comunidade escolar
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
