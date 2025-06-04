// src/config/roles.ts
export const USER_ROLES = {
  ADMIN_GERAL: 'Admin Geral',
  DIRETORIA: 'Diretoria',
  GERENTE_DE_SETOR: 'Gerente de Setor',
  USUARIO_DO_SETOR: 'Usuário do Setor',
  VISITANTE: 'Visitante',
} as const; // 'as const' makes it a true enum-like object

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Helper function (optional, but can be useful for more complex role hierarchies or permissions)
export const canPerformAction = (userRole: UserRole | undefined | null, allowedRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// Example: Check if a user is at least a certain level (more complex logic)
// export const isRoleAtLeast = (userRole: UserRole | undefined | null, minimumRole: UserRole): boolean => {
//   if (!userRole) return false;
//   const roleHierarchy: UserRole[] = [
//     USER_ROLES.VISITANTE,
//     USER_ROLES.USUARIO_DO_SETOR,
//     USER_ROLES.GERENTE_DE_SETOR,
//     USER_ROLES.DIRETORIA,
//     USER_ROLES.ADMIN_GERAL,
//   ];
//   const userLevel = roleHierarchy.indexOf(userRole);
//   const minimumLevel = roleHierarchy.indexOf(minimumRole);
//   if (userLevel === -1 || minimumLevel === -1) return false; // Role not in hierarchy
//   return userLevel >= minimumLevel;
// };
