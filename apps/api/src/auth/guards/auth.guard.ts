import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { OrgType } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser, JwtPayload } from '../types/auth-user';
import { IS_PUBLIC_KEY, ORG_TYPES_KEY } from '../decorator/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (isPublic) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = await this.authenticate(request);
    request.user = user;

    const orgTypes = this.reflector.getAllAndOverride<OrgType[] | undefined>(
      ORG_TYPES_KEY,
      targets,
    );
    if (orgTypes?.length) {
      if (!orgTypes.includes(user.org.type)) {
        throw new ForbiddenException('Your organisation cannot do this');
      }
      if (user.org.status !== 'LICENSED') {
        throw new ForbiddenException('Your organisation is not licensed');
      }
    }

    return true;
  }

  private async authenticate(request: Request): Promise<AuthUser> {
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    // A validly signed token without sub (e.g. an old token shape) would make Prisma throw a 500.
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Read role and org status from the DB so a revoke takes effect immediately.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        organization: { select: { id: true, type: true, status: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      org: user.organization,
    };
  }
}
