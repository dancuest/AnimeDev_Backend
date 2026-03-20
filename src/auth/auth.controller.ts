import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { DeviceLoginDto } from './dto/device-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('device')
  loginDevice(@Body() dto: DeviceLoginDto) {
    return this.auth.loginWithDevice(dto.deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  register(
    @Req() req: Request & { user?: { userId: string } },
    @Body() dto: RegisterDto,
  ) {
    return this.auth.register(req.user!.userId, dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.loginWithEmail(dto.email, dto.password);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.email, dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return this.auth.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user?: { userId: string } }) {
    return this.auth.me(req.user!.userId);
  }
}