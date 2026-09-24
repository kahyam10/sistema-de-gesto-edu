"use client";

import { PageWrap } from "@/components/ui/page-wrap";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth";
import { PortalProfessor } from "@/components/portal/PortalProfessor";
import { PortalResponsavel } from "@/components/portal/PortalResponsavel";
import { PortalDiretor } from "@/components/portal/PortalDiretor";
import { PortalSecretaria } from "@/components/portal/PortalSecretaria";
import { PortalCoordenacao } from "@/components/portal/PortalCoordenacao";
import { PortalSemec } from "@/components/portal/PortalSemec";

const PORTAIS: Record<
  string,
  { titulo: string; subtitulo: string; Componente: React.ComponentType }
> = {
  PROFESSOR: {
    titulo: "Portal do Professor",
    subtitulo: "Suas turmas, aulas do dia e pendências",
    Componente: PortalProfessor,
  },
  RESPONSAVEL: {
    titulo: "Portal do Aluno/Responsável",
    subtitulo: "Boletim, frequência e comunicados",
    Componente: PortalResponsavel,
  },
  USER: {
    titulo: "Portal do Aluno/Responsável",
    subtitulo: "Boletim, frequência e comunicados",
    Componente: PortalResponsavel,
  },
  DIRETOR: {
    titulo: "Portal do Diretor",
    subtitulo: "Indicadores da sua escola",
    Componente: PortalDiretor,
  },
  SECRETARIA: {
    titulo: "Portal da Secretaria",
    subtitulo: "Documentação, transferências e acessos",
    Componente: PortalSecretaria,
  },
  COORDENADOR: {
    titulo: "Portal da Coordenação",
    subtitulo: "Acompanhamento pedagógico da escola",
    Componente: PortalCoordenacao,
  },
  ADMIN: {
    titulo: "Portal da SEMEC",
    subtitulo: "Consolidado municipal da rede",
    Componente: PortalSemec,
  },
  SEMEC: {
    titulo: "Portal da SEMEC",
    subtitulo: "Consolidado municipal da rede",
    Componente: PortalSemec,
  },
};

export default function PortalPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  const portal = user?.role ? PORTAIS[user.role] : undefined;
  if (!portal) {
    return (
      <PageWrap
        title="Meu Portal"
        breadcrumb={[{ label: "Operação" }, { label: "Portal" }]}
      >
        <EmptyState icon="info" title="Portal indisponível para o seu perfil" />
      </PageWrap>
    );
  }
  const { titulo, subtitulo, Componente } = portal;
  return (
    <PageWrap
      title={titulo}
      subtitle={subtitulo}
      breadcrumb={[{ label: "Operação" }, { label: "Portal" }]}
    >
      <Componente />
    </PageWrap>
  );
}
