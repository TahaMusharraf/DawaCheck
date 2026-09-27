import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Request } from 'express';
import type { OrgType } from '../../generated/prisma/enums';
import type { AuthUser } from '../types/auth-user';

export const IS_PUBLIC_KEY = 'isPublic';
export const ORG_TYPES_KEY = 'orgTypes';

/** Skips authentication. Every route is protected unless marked with this. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Restricts a route to organisations of these types. The org must also be
 * LICENSED, so a PENDING or REVOKED org is refused even if its type matches.
 */
export const OrgTypes = (...types: OrgType[]) =>
  SetMetadata(ORG_TYPES_KEY, types);

/** Injects the authenticated user. Only valid on non-public routes. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthUser }>();
    return request.user;
  },
);
