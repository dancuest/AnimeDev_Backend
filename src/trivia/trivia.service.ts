import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RecordTriviaResultDto } from './dto/record-trivia-result.dto';
import { TriviaRecordResponseDto } from './dto/trivia-record-response.dto';
import { TriviaAnimeLastScoreDto, TriviaStatsDto } from './dto/trivia-stats.dto';
import { TRIVIA_REPOSITORY } from './storage/trivia.repository';
import { TriviaRecord, TriviaRepository } from './trivia.types';

@Injectable()
export class TriviaService {
  constructor(
    @Inject(TRIVIA_REPOSITORY)
    private readonly triviaRepository: TriviaRepository,
    private readonly usersService: UsersService,
  ) {}

  recordResult(userId: string, payload: RecordTriviaResultDto): TriviaRecordResponseDto {
    if (payload.correct > payload.total) {
      throw new BadRequestException('"correct" no puede ser mayor que "total".');
    }

    const record: TriviaRecord = {
      userId,
      animeId: payload.animeId,
      correct: payload.correct,
      total: payload.total,
      difficulty: payload.difficulty,
      playedAt: new Date(),
    };

    this.triviaRepository.save(record);
    const updatedProfile = this.usersService.incrementCompletedTrivias(userId);

    return {
      message: 'Resultado registrado correctamente.',
      completedTrivias: updatedProfile.completedTrivias,
    };
  }

  getStats(userId: string): TriviaStatsDto {
    const records = this.triviaRepository.getByUserId(userId);
    const lastScoreByAnime = new Map<number, TriviaAnimeLastScoreDto>();

    records.forEach((record) => {
      lastScoreByAnime.set(record.animeId, {
        animeId: record.animeId,
        correct: record.correct,
        total: record.total,
        difficulty: record.difficulty,
        playedAt: record.playedAt.toISOString(),
      });
    });

    return {
      totalPlayed: records.length,
      lastScoreByAnime: [...lastScoreByAnime.values()],
    };
  }
}
