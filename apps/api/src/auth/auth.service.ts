import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as argon2 from 'argon2';
import { JwtService } from 'node_modules/@nestjs/jwt/dist/jwt.service';
import { access } from 'fs';

@Injectable()
export class AuthService {

    constructor(private prismaService: PrismaService, private jwtService: JwtService) {}

    async register(dto: RegisterDto) {
        const user =  await this.prismaService.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (user) {
            throw new BadRequestException('User already exists');
        }

        const hashedPassword = await argon2.hash(dto.password);
        
        const org = await this.prismaService.organization.create({
            data: {
                name: dto.orgName,
                type: dto.orgType,
                licenseNo: dto.licenseNo,
                city: dto.city,
                users: {
                    create: {
                        email: dto.email,
                        passwordHash: hashedPassword,
                        role: 'ADMIN'
                    },
                },
            },
        });

        if (!org) {
            throw new BadRequestException('Organization creation failed');
        }

        return {
            message: 'Organization and admin user created successfully',
            organization: {
                    name: org.name,
                    type: org.type,
                    licenseNo: org.licenseNo,
                    city: org.city,
                    email: dto.email,
            },
            accessToken: await this.jwtService.signAsync({ email: dto.email, orgId: org.id, role: 'ADMIN' })
        }
    }

    async login(dto: LoginDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email: dto.email,
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        const isMatch = await argon2.verify(user.passwordHash, dto.password);

        if (!isMatch) {
            throw new BadRequestException('Invalid credentials');
        }

        return {
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken: await this.jwtService.signAsync({ email: user.email, orgId: user.orgId, role: user.role })
        };
    }

}
