import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnimeService } from '../anime/anime.service';

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
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly animeService: AnimeService,
  ) {}

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
    const normalizedEmail = dto.email?.trim();
    const emailUpdateValue =
      dto.email === undefined ? undefined : normalizedEmail ? normalizedEmail : null;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName?.trim() || undefined,
        email: emailUpdateValue,
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
    const settings = await this.prisma.userSettings.upsert({
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

    const preferredGenreDetails = await this.resolvePreferredGenreDetails(settings.preferredGenres);

    return {
      ...settings,
      preferredGenreDetails,
    };
  }

  async updateMySettings(userId: string, dto: UpdateSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
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

    const preferredGenreDetails = await this.resolvePreferredGenreDetails(settings.preferredGenres);

    return {
      ...settings,
      preferredGenreDetails,
    };
  }

  private async resolvePreferredGenreDetails(preferredGenres: number[]) {
    if (!preferredGenres.length) {
      return [];
    }

    try {
      const genresCatalog = await this.animeService.getGenres(true);
      const genreMap = new Map(
        genresCatalog.data.map((genre) => [Number(genre.id), { id: Number(genre.id), name: genre.name }]),
      );

      return preferredGenres
        .map((genreId) => genreMap.get(genreId))
        .filter((genre): genre is { id: number; name: string } => Boolean(genre));
    } catch (error) {
      this.logger.warn('Could not resolve preferred genre details from catalog');
      return [];
    }
  }
}
