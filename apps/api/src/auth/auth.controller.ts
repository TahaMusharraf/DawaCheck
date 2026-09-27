import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorator/decorators';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { AuthUser } from './types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    return user;
  }
}
