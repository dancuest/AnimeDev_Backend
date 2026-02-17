import { Injectable } from '@nestjs/common';
import { TriviaRecord, TriviaRepository } from '../trivia.types';

export const TRIVIA_REPOSITORY = Symbol('TRIVIA_REPOSITORY');

@Injectable()
export class InMemoryTriviaRepository implements TriviaRepository {
  private readonly recordsByUser = new Map<string, TriviaRecord[]>();

  save(record: TriviaRecord): TriviaRecord {
    const current = this.recordsByUser.get(record.userId) ?? [];
    current.push(record);
    this.recordsByUser.set(record.userId, current);

    return record;
  }

  getByUserId(userId: string): TriviaRecord[] {
    return [...(this.recordsByUser.get(userId) ?? [])];
  }
}
