export interface TriviaRecord {
  userId: string;
  animeId: number;
  correct: number;
  total: number;
  difficulty: string;
  playedAt: Date;
}

export interface TriviaRepository {
  save(record: TriviaRecord): TriviaRecord;
  getByUserId(userId: string): TriviaRecord[];
}
