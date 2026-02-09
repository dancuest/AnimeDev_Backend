import {
  AnimeDto,
  DurationType,
  AiringStatus,
} from './dto/anime.dto';
import { JikanAnime } from './types/jikan.types';

const DEFAULT_MANGA_PLUS_BASE =
  'https://mangaplus.shueisha.co.jp/titles?search=';

export class AnimeMapper {
  toAnimeDto(anime: JikanAnime): AnimeDto {
    const durationMinutes = this.parseDurationMinutes(anime.duration ?? '');
    const durationType = this.toDurationType(durationMinutes);
    const airingStatus = this.toAiringStatus(anime.status ?? '');
    const imageUrl =
      anime.images?.jpg?.large_image_url ??
      anime.images?.jpg?.image_url ??
      '';
    const title = anime.title ?? '';

    return {
      id: anime.mal_id,
      title,
      originalTitle: anime.title_japanese ?? anime.title_english ?? null,
      synopsis: anime.synopsis ?? '',
      imageUrl,
      mangaPlusSearchUrl: this.buildMangaPlusUrl(title),
      episodeCount: anime.episodes ?? null,
      durationType,
      airingStatus,
      releaseYear: anime.year ?? null,
      genres: (anime.genres ?? []).map((genre) => genre.name),
      score: anime.score ?? null,
      rating: anime.rating ?? null,
      season: anime.season ?? null,
      studios: (anime.studios ?? []).map((studio) => studio.name),
      trailerUrl: anime.trailer?.url ?? anime.trailer?.embed_url ?? null,
    };
  }

  private toDurationType(minutes: number | null): DurationType {
    if (!minutes) {
      return DurationType.MEDIUM;
    }

    if (minutes <= 15) {
      return DurationType.SHORT;
    }

    if (minutes <= 30) {
      return DurationType.MEDIUM;
    }

    return DurationType.LONG;
  }

  private toAiringStatus(status: string): AiringStatus {
    const normalized = status.toLowerCase();
    if (normalized.includes('airing')) {
      return AiringStatus.ON_AIR;
    }
    if (normalized.includes('finished')) {
      return AiringStatus.FINISHED;
    }
    if (normalized.includes('not yet') || normalized.includes('upcoming')) {
      return AiringStatus.UPCOMING;
    }
    return AiringStatus.UNKNOWN;
  }

  private parseDurationMinutes(duration: string): number | null {
    const match = duration.match(/(\d+)\s*min/);
    if (!match) {
      return null;
    }

    return Number(match[1]);
  }

  private buildMangaPlusUrl(title: string): string {
    const encoded = encodeURIComponent(title.trim());
    return `${DEFAULT_MANGA_PLUS_BASE}${encoded}`;
  }
}
