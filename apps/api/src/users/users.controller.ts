import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, OrgTypes } from 'src/auth/decorator/decorators';
import { UpdateUserDto } from './dto/user.dto';
import { type AuthUser } from 'src/auth/types/auth-user';
import { OrgType } from 'src/generated/prisma/enums';

@Controller('users')
export class UsersController {

    constructor(
        private usersService: UsersService,
    ) {}

    @OrgTypes(OrgType.REGULATOR)
    @Get('all')
    async getUsers(){
        return this.usersService.getAllUsers();
    }

    @Patch('update')
    async updateUser(@Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser  ) {
        return this.usersService.updateUser(dto, user.id);
    }
}
