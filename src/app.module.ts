import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../config/configuration';
import { validateEnvironment } from '../config/env.validation';
import { AnimeModule } from './anime/anime.module';
import { HealthModule } from './health/health.module';
import { TriviaModule } from './trivia/trivia.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('cacheTtlMs') ?? 600_000,
      }),
    }),
    HealthModule,
    AnimeModule,
    UsersModule,
    TriviaModule,
  ],
})
export class AppModule { }
