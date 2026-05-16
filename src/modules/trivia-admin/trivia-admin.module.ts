import { Module } from '@nestjs/common';
import { TriviaAdminController } from './trivia-admin.controller';
import { TriviaAdminService } from './trivia-admin.service';

@Module({
  controllers: [TriviaAdminController],
  providers: [TriviaAdminService],
  exports: [TriviaAdminService],
})
export class TriviaAdminModule {}