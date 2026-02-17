import { ApiProperty } from '@nestjs/swagger';

export class TriviaAnimeLastScoreDto {
  @ApiProperty({ example: 5114 })
  animeId!: number;

  @ApiProperty({ example: 8 })
  correct!: number;

  @ApiProperty({ example: 10 })
  total!: number;

  @ApiProperty({ example: 'medium' })
  difficulty!: string;

  @ApiProperty({ example: '2026-01-15T12:00:00.000Z' })
  playedAt!: string;
}

export class TriviaStatsDto {
  @ApiProperty({ example: 4 })
  totalPlayed!: number;

  @ApiProperty({ type: [TriviaAnimeLastScoreDto] })
  lastScoreByAnime!: TriviaAnimeLastScoreDto[];
}
