import { Role } from "@prisma/client";

export function isStaff(role: Role) {
  return role === Role.ADMIN || role === Role.MATCHMAKER;
}

export function canManagePayments(role: Role) {
  return role === Role.ADMIN;
}

export function canReviewApplications(role: Role) {
  return isStaff(role);
}

export function canProposeMatches(role: Role) {
  return isStaff(role);
}
