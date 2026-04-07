import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DeviceLoginDto } from './dto/device-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  AuthMeResponseDto,
  AuthSessionResponseDto,
  BasicMessageResponseDto,
  ForgotPasswordResponseDto,
} from './dto/auth-swagger.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('device')
  @ApiOperation({ summary: 'Create or resume a device session' })
  @ApiCreatedResponse({
    type: AuthSessionResponseDto,
    description: 'Returns a JWT and profile information for the device user',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  loginDevice(@Body() dto: DeviceLoginDto) {
    return this.auth.loginWithDevice(dto.deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('register')
  @ApiOperation({
    summary:
      'Register email/password credentials for the currently authenticated device user',
  })
  @ApiCreatedResponse({
    type: AuthSessionResponseDto,
    description: 'Returns a JWT and profile information for the registered user',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or email already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
  })
  register(
    @Req() req: Request & { user?: { userId: string } },
    @Body() dto: RegisterDto,
  ) {
    return this.auth.register(req.user!.userId, dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiCreatedResponse({
    type: AuthSessionResponseDto,
    description: 'Returns a JWT and profile information',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or credentials are invalid',
  })
  login(@Body() dto: LoginDto) {
    return this.auth.loginWithEmail(dto.email, dto.password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Generate password reset token in demo mode' })
  @ApiCreatedResponse({
    type: ForgotPasswordResponseDto,
    description: 'Returns token metadata for password recovery',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or user has no email password flow configured',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using a valid token' })
  @ApiCreatedResponse({
    type: BasicMessageResponseDto,
    description: 'Indicates whether the password was reset successfully',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or token/email combination is invalid',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.email, dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @ApiOperation({ summary: 'Logout current session' })
  @ApiCreatedResponse({
    type: BasicMessageResponseDto,
    description: 'Returns logout confirmation message',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
  })
  logout() {
    return this.auth.logout();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated profile' })
  @ApiOkResponse({
    type: AuthMeResponseDto,
    description: 'Returns current authenticated profile data',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
  })
  me(@Req() req: Request & { user?: { userId: string } }) {
    return this.auth.me(req.user!.userId);
  }
}