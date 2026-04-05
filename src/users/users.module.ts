import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnimeModule } from '../anime/anime.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AnimeModule, InteractionsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}