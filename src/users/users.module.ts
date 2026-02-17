import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  InMemoryUserProfileRepository,
  USER_PROFILE_REPOSITORY,
} from './storage/user-profile.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    InMemoryUserProfileRepository,
    {
      provide: USER_PROFILE_REPOSITORY,
      useExisting: InMemoryUserProfileRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
