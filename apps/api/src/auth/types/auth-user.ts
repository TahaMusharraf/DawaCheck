import type { OrgStatus, OrgType, UserRole } from '../../generated/prisma/enums';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  org: { id: string; type: OrgType; status: OrgStatus };
}

export interface JwtPayload {
  sub: string;
  orgId: string;
}
