import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';
import {
  ChangePasswordResponseDto,
  FavoriteIdsResponseDto,
  UserMeResponseDto,
  UserSettingsResponseDto,
} from './dto/users-swagger.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and stats' })
  @ApiOkResponse({
    type: UserMeResponseDto,
    description: 'Returns profile data plus trivia and favorites stats',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  me(@Req() req: any) {
    return this.users.getMe(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    type: UserMeResponseDto,
    description: 'Returns updated profile data plus trivia and favorites stats',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/settings')
  @ApiOperation({ summary: 'Get current user recommendation settings' })
  @ApiOkResponse({
    type: UserSettingsResponseDto,
    description: 'Returns current demographic and preference settings',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getSettings(@Req() req: any) {
    return this.users.getMySettings(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/settings')
  @ApiOperation({ summary: 'Update current user recommendation settings' })
  @ApiOkResponse({
    type: UserSettingsResponseDto,
    description: 'Returns updated demographic and preference settings',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.users.updateMySettings(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/favorites')
  @ApiOperation({
    summary: 'Get current user favorite anime IDs derived from interactions',
  })
  @ApiOkResponse({
    type: FavoriteIdsResponseDto,
    description: 'Returns favorite anime ids and total count',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async getMyFavorites(
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const favoriteAnimeIds = await this.users.getFavoriteAnimeIds(
      req.user!.userId,
    );

    return {
      data: favoriteAnimeIds,
      count: favoriteAnimeIds.length,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiOkResponse({
    type: ChangePasswordResponseDto,
    description: 'Returns confirmation message when password was updated',
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, current password is wrong, or new password is invalid',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    try {
      return await this.users.changePassword(
        req.user.userId,
        dto.currentPassword,
        dto.newPassword,
      );
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}