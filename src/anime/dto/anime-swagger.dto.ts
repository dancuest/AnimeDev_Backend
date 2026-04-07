import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DurationType, EmissionStatus } from './anime.dto';

export class AnimeGenreResponseDto {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Action' })
  name!: string;
}

export class AnimeResponseDto {
  @ApiProperty({ example: 5114 })
  id!: number;

  @ApiProperty({ example: '5114' })
  externalApiId!: string;

  @ApiProperty({ example: 'Fullmetal Alchemist: Brotherhood' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Hagane no Renkinjutsushi: Fullmetal Alchemist',
    nullable: true,
  })
  originalTitle!: string | null;

  @ApiProperty({
    example: 'Two brothers search for a Philosopher’s Stone after an alchemy experiment goes wrong.',
  })
  synopsis!: string;

  @ApiProperty({
    example: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
  })
  coverImageUrl!: string;

  @ApiProperty({
    example: 'https://mangaplus.shueisha.co.jp/',
  })
  mangaPlusUrl!: string;

  @ApiPropertyOptional({
    example: 64,
    nullable: true,
  })
  totalEpisodes!: number | null;

  @ApiProperty({
    enum: DurationType,
    example: DurationType.MEDIUM,
  })
  durationType!: DurationType;

  @ApiProperty({
    enum: EmissionStatus,
    example: EmissionStatus.FINISHED,
  })
  emissionStatus!: EmissionStatus;

  @ApiPropertyOptional({
    example: 2009,
    nullable: true,
  })
  releaseYear!: number | null;

  @ApiProperty({
    type: [AnimeGenreResponseDto],
  })
  genres!: AnimeGenreResponseDto[];
}

export class TrailerResponseDto {
  @ApiProperty({ example: 1 })
  number!: number;

  @ApiProperty({ example: 'Trailer oficial' })
  title!: string;

  @ApiProperty({ example: 2 })
  durationMinutes!: number;

  @ApiProperty({
    example: 'Avance oficial disponible en YouTube.',
  })
  description!: string;

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=XXXXX',
  })
  youtubeUrl!: string;
}

export class AnimeDetailDataResponseDto {
  @ApiProperty({ type: AnimeResponseDto })
  anime!: AnimeResponseDto;

  @ApiProperty({
    type: [String],
    example: ['Obra influyente del shonen moderno'],
  })
  culturalNotes!: string[];

  @ApiProperty({
    type: [TrailerResponseDto],
  })
  trailers!: TrailerResponseDto[];
}

export class LimitMetaResponseDto {
  @ApiProperty({ example: 10 })
  limit!: number;
}

export class SearchMetaResponseDto {
  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 245 })
  total!: number;

  @ApiProperty({ example: 10 })
  count!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;
}

export class AnimeListResponseDto {
  @ApiProperty({ type: [AnimeResponseDto] })
  data!: AnimeResponseDto[];

  @ApiProperty({ type: LimitMetaResponseDto })
  meta!: LimitMetaResponseDto;
}

export class AnimeSearchResponseDto {
  @ApiProperty({ type: [AnimeResponseDto] })
  data!: AnimeResponseDto[];

  @ApiProperty({ type: SearchMetaResponseDto })
  meta!: SearchMetaResponseDto;
}

export class AnimeSingleResponseDto {
  @ApiProperty({ type: AnimeResponseDto })
  data!: AnimeResponseDto;
}

export class AnimeDetailResponseDto {
  @ApiProperty({ type: AnimeDetailDataResponseDto })
  data!: AnimeDetailDataResponseDto;
}

export class AnimeGenreCatalogResponseDto {
  @ApiProperty({ type: [AnimeGenreResponseDto] })
  data!: AnimeGenreResponseDto[];
}