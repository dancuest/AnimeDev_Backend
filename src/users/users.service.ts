import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type UpdateProfileDto = {
  displayName?: string;
  email?: string;
};

type UpdateSettingsDto = {
  ageRange?: number;
  genderCode?: number;
  regionCode?: number;
  preferredGenres?: number[];
  preferredDurations?: string[];
  toggles?: any; 
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        deviceId: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName ?? undefined,
        email: dto.email ?? undefined,
      },
      select: {
        id: true,
        deviceId: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });
  }

  async getMySettings(userId: string) {
    // upsert: si no existen settings, los crea
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
      select: {
        userId: true,
        ageRange: true,
        genderCode: true,
        regionCode: true,
        preferredGenres: true,
        preferredDurations: true,
        toggles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateMySettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ageRange: dto.ageRange ?? undefined,
        genderCode: dto.genderCode ?? undefined,
        regionCode: dto.regionCode ?? undefined,
        preferredGenres: dto.preferredGenres ?? undefined,
        preferredDurations: dto.preferredDurations ?? undefined,
        toggles: dto.toggles ?? undefined,
      },
      create: {
        userId,
        ageRange: dto.ageRange ?? 0,
        genderCode: dto.genderCode ?? 0,
        regionCode: dto.regionCode ?? 0,
        preferredGenres: dto.preferredGenres ?? [],
        preferredDurations: dto.preferredDurations ?? [],
        toggles: dto.toggles ?? {},
      },
      select: {
        userId: true,
        ageRange: true,
        genderCode: true,
        regionCode: true,
        preferredGenres: true,
        preferredDurations: true,
        toggles: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}