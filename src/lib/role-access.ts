import type { UserRole } from "@/lib/supabase-api";

export function isPlayerRole(role?: UserRole | null) {
  return role === "player";
}

export function canManageAcademyUi(role?: UserRole | null) {
  return role === "coach" || role === "academy_owner" || role === "super_admin";
}

export function canAccessStaffArea(role?: UserRole | null) {
  return !isPlayerRole(role);
}

export function isRestrictedPlayerRoute(pathname: string) {
  return ["/academy", "/team", "/reports", "/analytics", "/create-match", "/requests"].some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getRoleHomePath(role?: UserRole | null) {
  return isPlayerRole(role) ? "/profile" : "/";
}
