import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TriviaController } from './trivia.controller';
import {
  InMemoryTriviaRepository,
  TRIVIA_REPOSITORY,
} from './storage/trivia.repository';
import { TriviaService } from './trivia.service';

@Module({
  imports: [UsersModule],
  controllers: [TriviaController],
  providers: [
    TriviaService,
    InMemoryTriviaRepository,
    {
      provide: TRIVIA_REPOSITORY,
      useExisting: InMemoryTriviaRepository,
    },
  ],
})
export class TriviaModule {}
