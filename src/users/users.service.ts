import { Inject, Injectable } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { USER_PROFILE_REPOSITORY } from './storage/user-profile.repository';
import { UserProfileRepository } from './user-profile.types';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: UserProfileRepository,
  ) {}

  getMe(userId: string): UserProfileDto {
    const profile = this.userProfileRepository.getByUserId(userId) ??
      this.userProfileRepository.patch(userId, {});

    return this.toDto(profile);
  }

  updateMe(userId: string, update: UpdateUserProfileDto): UserProfileDto {
    const updatedProfile = this.userProfileRepository.patch(userId, update);

    return this.toDto(updatedProfile);
  }

  incrementCompletedTrivias(userId: string, incrementBy = 1): UserProfileDto {
    const updatedProfile = this.userProfileRepository.incrementCompletedTrivias(userId, incrementBy);

    return this.toDto(updatedProfile);
  }

  private toDto(profile: {
    displayName: string;
    bio: string;
    profileImageUrl: string;
    preferredGenres: string[];
    completedTrivias: number;
  }): UserProfileDto {
    return {
      displayName: profile.displayName,
      bio: profile.bio,
      profileImageUrl: profile.profileImageUrl,
      preferredGenres: profile.preferredGenres,
      completedTrivias: profile.completedTrivias,
    };
  }
}
