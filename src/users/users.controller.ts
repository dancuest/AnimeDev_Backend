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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UsersService } from './users.service';

class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.users.getMe(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/settings')
  getSettings(@Req() req: any) {
    return this.users.getMySettings(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me/settings')
  updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.users.updateMySettings(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me/favorites')
  @ApiOperation({
    summary: 'Get current user favorite anime IDs derived from interactions',
  })
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