export const UserRole = {
  ADMIN: "ADMIN",
  SEMEC: "SEMEC",
  DIRETOR: "DIRETOR",
  COORDENADOR: "COORDENADOR",
  SECRETARIA: "SECRETARIA",
  PROFESSOR: "PROFESSOR",
  RESPONSAVEL: "RESPONSAVEL",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RoleHierarchy: Record<UserRole, number> = {
  ADMIN: 7,
  SEMEC: 6,
  DIRETOR: 5,
  COORDENADOR: 4,
  SECRETARIA: 3,
  PROFESSOR: 2,
  RESPONSAVEL: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}

export function canAccessResource(userRole: UserRole, resourceOwnerRole: UserRole): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[resourceOwnerRole];
}

// Permissões específicas por módulo
export const ModulePermissions = {
  // Gestão de Matrículas
  MATRICULAS_CREATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.SECRETARIA, UserRole.DIRETOR],
  MATRICULAS_UPDATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.SECRETARIA, UserRole.DIRETOR],
  MATRICULAS_DELETE: [UserRole.ADMIN, UserRole.SEMEC],
  MATRICULAS_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.SECRETARIA, UserRole.DIRETOR, UserRole.COORDENADOR],

  // Gestão de Turmas
  TURMAS_CREATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR],
  TURMAS_UPDATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR],
  TURMAS_DELETE: [UserRole.ADMIN, UserRole.SEMEC],
  TURMAS_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR],

  // Gestão Pedagógica
  NOTAS_CREATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR],
  NOTAS_UPDATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR],
  NOTAS_DELETE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR],
  NOTAS_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR, UserRole.RESPONSAVEL],

  FREQUENCIA_CREATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR],
  FREQUENCIA_UPDATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR],
  FREQUENCIA_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR, UserRole.RESPONSAVEL],

  // Gestão de Profissionais
  PROFISSIONAIS_CREATE: [UserRole.ADMIN, UserRole.SEMEC],
  PROFISSIONAIS_UPDATE: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR],
  PROFISSIONAIS_DELETE: [UserRole.ADMIN, UserRole.SEMEC],
  PROFISSIONAIS_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR],

  // Gestão de Escolas
  ESCOLAS_CREATE: [UserRole.ADMIN, UserRole.SEMEC],
  ESCOLAS_UPDATE: [UserRole.ADMIN, UserRole.SEMEC],
  ESCOLAS_DELETE: [UserRole.ADMIN, UserRole.SEMEC],
  ESCOLAS_VIEW: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.SECRETARIA],

  // Relatórios
  RELATORIOS_GERENCIAIS: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR],
  RELATORIOS_PEDAGOGICOS: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR],
  RELATORIOS_INDIVIDUAIS: [UserRole.ADMIN, UserRole.SEMEC, UserRole.DIRETOR, UserRole.COORDENADOR, UserRole.PROFESSOR, UserRole.RESPONSAVEL],
} as const;

export type Permission = keyof typeof ModulePermissions;

export function hasModulePermission(userRole: UserRole, permission: Permission): boolean {
  return (ModulePermissions[permission] as readonly string[]).includes(userRole);
}
