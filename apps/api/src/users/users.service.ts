import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {

    constructor(
        private prismaService: PrismaService,
    ) {}
    
    async getAllUsers() {
        const users = await this.prismaService.user.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
                organization: {
                    select: {
                        name: true,
                        type: true,
                        city: true,
                        status: true
                    }
                }
            }
        });
        return {
            message: 'Users fetched successfully',
            data: users,
        };
    }

    async updateUser(dto: UpdateUserDto, userId: string) {
        
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) throw new NotFoundException('User not found');

        const verify = await argon2.verify(user.passwordHash, dto.password);

        if (!verify) throw new BadRequestException('Password is incorrect');

        if (dto.email && dto.email !== user.email) {
            const taken = await this.prismaService.user.findUnique({
                where: {
                    email: dto.email
                }
            })
            if (taken) throw new ConflictException('This email is already in use');
        }

        let newPasswordHash;
        if (dto.newPassword) {
            newPasswordHash = await argon2.hash(dto.newPassword);
        }

        const updatedUser = await this.prismaService.user.update({
            where:{
                id: userId
            },
            data: {
                email: dto.email,
                passwordHash: newPasswordHash
            },
            select: {
                id: true,
                email: true,
                updatedAt: true
            }
        })
        return {
            message: 'User updated successfully',
            data: updatedUser,
        };
    }
}
