import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { lastValueFrom } from 'rxjs';

import { AnimeMapper } from './anime.mapper';
import { AnimeDetailDto } from './dto/anime-detail.dto';
import { AnimeDto, GenreDto } from './dto/anime.dto';
import {
  JikanAnime,
  JikanDetailResponse,
  JikanListResponse,
} from './types/jikan.types';

interface TranslationResponse {
  responseData?: {
    translatedText?: string;
  };
}

@Injectable()
export class AnimeService {
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly shortCacheTtlMs: number;
  private readonly translateSynopses: boolean;
  private readonly translationBaseUrl: string;

  private static readonly ADULT_GENRE_IDS = new Set(['9', '12', '49']);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly mapper: AnimeMapper,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    
    this.baseUrl =
    this.configService.get<string>('jikanBaseUrl') ?? 'https://api.jikan.moe/v4';

  this.cacheTtlMs = this.configService.get<number>('cacheTtlMs') ?? 600_000;
  this.shortCacheTtlMs =
    this.configService.get<number>('shortCacheTtlMs') ?? 60_000;

  this.translateSynopses =
    this.configService.get<boolean>('translateSynopses') ?? true;

  this.translationBaseUrl =
    this.configService.get<string>('translationBaseUrl') ??
    'https://api.mymemory.translated.net/get';
  }

  /**
   * If includeAdult !== true -> enforce sfw=true upstream (Jikan)
   */
  private withSfw(
    params: Record<string, unknown>,
    includeAdult?: boolean,
  ): Record<string, unknown> {
    if (includeAdult === true) {
      return params;
    }

    return {
      ...params,
      sfw: true,
    };
  }

  async getTop(limit = 10, requestId?: string, includeAdult?: boolean) {
    const cacheKey = `anime:top:${limit}:${includeAdult === true ? 'all' : 'sfw'}`;

    const data = await this.getCached(
      cacheKey,
      async () => {
        const response = await this.fetchList<JikanAnime>(
          '/top/anime',
          this.withSfw({ limit }, includeAdult),
          requestId,
        );

        return response.data.map((anime) => this.mapper.toAnimeDto(anime));
      },
      this.shortCacheTtlMs,
    );

    return {
      data,
      meta: { limit },
    };
  }

  async search(
    query: string,
    limit = 10,
    requestId?: string,
    includeAdult?: boolean,
  ) {
    const response = await this.fetchList<JikanAnime>(
      '/anime',
      this.withSfw({ q: query, limit }, includeAdult),
      requestId,
    );

    return {
      data: response.data.map((anime) => this.mapper.toAnimeDto(anime)),
      meta: {
        limit,
        total: response.pagination?.items?.total ?? response.data.length,
        count: response.pagination?.items?.count ?? response.data.length,
        hasNextPage: response.pagination?.has_next_page ?? false,
      },
    };
  }

  async getById(id: number, requestId?: string): Promise<{ data: AnimeDto }> {
    const cacheKey = `anime:${id}`;

    const anime = await this.getCached(cacheKey, async () => {
      const response = await this.fetchDetail<JikanAnime>(`/anime/${id}`, requestId);
      return this.mapper.toAnimeDto(response.data);
    });

    return {
      data: anime,
    };
  }

  async getDetail(id: number, requestId?: string): Promise<{ data: AnimeDetailDto }> {
    const cacheKey = `anime:detail:${id}:es`;

    const detail = await this.getCached(cacheKey, async () => {
      const response = await this.fetchDetail<JikanAnime>(`/anime/${id}/full`, requestId);
      const anime = this.mapper.toAnimeDto(response.data);

      const animeWithSpanishSynopsis: AnimeDto = {
        ...anime,
        synopsis: await this.translateSynopsisToSpanish(anime.synopsis),
      };

      return {
        anime: animeWithSpanishSynopsis,
        culturalNotes: this.buildCulturalNotes(animeWithSpanishSynopsis, response.data),

        trailers: [],
      };
    });

    return { data: detail };
  }

  async getHero(requestId?: string): Promise<{ data: AnimeDto }> {
  const cacheKey = 'anime:hero:es';

  const anime = await this.getCached(
    cacheKey,
    async () => {
      const response = await this.fetchList<JikanAnime>(
        '/top/anime',
        this.withSfw({ limit: 10 }, false),
        requestId,
      );

      const items = response.data.map((item) => this.mapper.toAnimeDto(item));

      if (items.length === 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'No hero anime available from upstream provider',
            upstream: 'jikan',
            requestId: requestId ?? null,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const selectedAnime = items[Math.floor(Math.random() * items.length)];

      return {
        ...selectedAnime,
        synopsis: await this.translateSynopsisToSpanish(selectedAnime.synopsis),
      };
    },
    this.shortCacheTtlMs,
  );

  return { data: anime };
}

  async getByGenre(
    genreId: string,
    limit = 10,
    requestId?: string,
    includeAdult?: boolean,
  ): Promise<{ data: AnimeDto[]; meta: { limit: number } }> {
    const cacheKey = `anime:genre:${genreId}:${limit}:${includeAdult === true ? 'all' : 'sfw'}`;

    const data = await this.getCached(
      cacheKey,
      async () => {
        const response = await this.fetchList<JikanAnime>(
          '/anime',
          this.withSfw({ genres: genreId, limit }, includeAdult),
          requestId,
        );

        return response.data.map((anime) => this.mapper.toAnimeDto(anime));
      },
      this.shortCacheTtlMs,
    );

    return {
      data,
      meta: { limit },
    };
  }

  async getGenres(includeAdult = true, requestId?: string): Promise<{ data: GenreDto[] }> {
    const cacheKey = `anime:genres:${includeAdult ? 'all' : 'safe'}`;

    const genres = await this.getCached(
      cacheKey,
      async () => {
        const response = await this.fetchList<{ mal_id: number; name: string }>(
          '/genres/anime',
          {},
          requestId,
        );

        const mappedGenres = response.data.map((genre) => this.mapper.toGenreDto(genre));

        if (includeAdult) {
          return mappedGenres;
        }

        return mappedGenres.filter(
          (genre) => !AnimeService.ADULT_GENRE_IDS.has(genre.id),
        );
      },
      this.shortCacheTtlMs,
    );

    return {
      data: genres,
    };
  }

  private async fetchList<T>(
    endpoint: string,
    params: Record<string, unknown>,
    requestId?: string,
  ): Promise<JikanListResponse<T>> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<JikanListResponse<T>>(`${this.baseUrl}${endpoint}`, {
          params,
        }),
      );

      return response.data;
    } catch (error) {
      throw this.buildUpstreamError(error, requestId, endpoint);
    }
  }

  private async fetchDetail<T>(
    endpoint: string,
    requestId?: string,
  ): Promise<JikanDetailResponse<T>> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<JikanDetailResponse<T>>(`${this.baseUrl}${endpoint}`),
      );

      return response.data;
    } catch (error) {
      throw this.buildUpstreamError(error, requestId, endpoint);
    }
  }

  private async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = this.cacheTtlMs,
  ): Promise<T> {
    const cached = await this.cacheManager.get<T>(key);

    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.cacheManager.set(key, fresh, ttlMs);
    return fresh;
  }

  private buildUpstreamError(
    error: unknown,
    requestId: string | undefined,
    endpoint: string,
  ) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: { message?: string; error?: string };
      };
      message?: string;
      code?: string;
    };

    const upstreamStatus = axiosError.response?.status;
    const statusCode =
      upstreamStatus && upstreamStatus >= 500
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.BAD_GATEWAY;

    const upstreamMessage =
      axiosError.response?.data?.message ?? axiosError.response?.data?.error;

    const fallbackMessage = `Jikan upstream request failed at ${endpoint}`;

    return new HttpException(
      {
        error: {
          code: 'UPSTREAM_FAILURE',
          message: upstreamMessage ?? axiosError.message ?? fallbackMessage,
          requestId: requestId ?? null,
        },
      },
      statusCode,
    );
  }

  private buildCulturalNotes(anime: AnimeDto, source: JikanAnime): string[] {
    const notes: string[] = [];

    if (anime.releaseYear) {
      notes.push(`Estrenado en ${anime.releaseYear}.`);
    }

    if (source.season) {
      notes.push(`Temporada original: ${source.season}.`);
    }

    if (source.studios && source.studios.length > 0) {
      const studioNames = source.studios
        .slice(0, 2)
        .map((studio) => studio.name)
        .join(', ');
      notes.push(`Producción a cargo de ${studioNames}.`);
    }

    if (anime.genres.length > 0) {
      const genreNames = anime.genres
        .slice(0, 3)
        .map((genre) => genre.name)
        .join(', ');
      notes.push(`Combina elementos de ${genreNames}.`);
    }

    notes.push('Ideal para explorar nuevas tendencias del anime.');
    notes.push('Recomendado para fans que buscan historias memorables.');

    return notes.slice(0, 4);
  }
  private async translateSynopsisToSpanish(synopsis: string): Promise<string> {
  const cleanSynopsis = synopsis.trim();

  if (!cleanSynopsis) {
    return 'Sinopsis no disponible.';
  }

  if (!this.translateSynopses) {
    return cleanSynopsis;
  }

  try {
    const chunks = this.splitTextIntoChunks(cleanSynopsis, 450);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      translatedChunks.push(await this.translateChunkToSpanish(chunk));
    }

    const translated = translatedChunks.join(' ').trim();

    return translated || cleanSynopsis;
  } catch {
    return cleanSynopsis;
  }
}

private async translateChunkToSpanish(text: string): Promise<string> {
  const response = await lastValueFrom(
    this.httpService.get<TranslationResponse>(this.translationBaseUrl, {
      params: {
        q: text,
        langpair: 'en|es',
      },
      timeout: 8000,
    }),
  );

  const translatedText = response.data?.responseData?.translatedText?.trim();

  if (!translatedText) {
    return text;
  }

  return this.decodeHtmlEntities(translatedText);
}

private splitTextIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).trim().length <= maxLength) {
      currentChunk = (currentChunk + ' ' + sentence).trim();
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    currentChunk = sentence;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxLength)];
}

private decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
}