export function isAdminUser(rol: string | null | undefined): boolean {
  return rol === 'admin' || rol === 'administracion';
}
