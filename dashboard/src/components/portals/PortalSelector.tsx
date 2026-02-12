"use client";

import { useAuth } from "@/contexts/AuthContext";
import { PortalProfessor } from "./PortalProfessor";
import { PortalResponsavel } from "./PortalResponsavel";
import { PortalDiretor } from "./PortalDiretor";
import { PortalSecretaria } from "./PortalSecretaria";
import { PortalSEMEC } from "./PortalSEMEC";
import { PortalAdmin } from "./PortalAdmin";

export function PortalSelector() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Você precisa estar autenticado</p>
        </div>
      </div>
    );
  }

  // Redireciona para o portal específico baseado no role
  switch (user.role) {
    case "ADMIN":
      return <PortalAdmin />;
    case "SEMEC":
      return <PortalSEMEC />;
    case "DIRETOR":
    case "COORDENADOR":
      return <PortalDiretor />;
    case "SECRETARIA":
      return <PortalSecretaria />;
    case "PROFESSOR":
      return <PortalProfessor />;
    case "RESPONSAVEL":
      return <PortalResponsavel />;
    default:
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-muted-foreground">
            Role não reconhecido: {user.role}
          </p>
        </div>
      );
  }
}
