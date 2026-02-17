import { Injectable } from '@nestjs/common';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { UserProfile, UserProfileRepository } from '../user-profile.types';

export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');

@Injectable()
export class InMemoryUserProfileRepository implements UserProfileRepository {
  private readonly profiles = new Map<string, UserProfile>();

  getByUserId(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  save(profile: UserProfile): UserProfile {
    this.profiles.set(profile.userId, profile);

    return profile;
  }

  patch(userId: string, patch: UpdateUserProfileDto): UserProfile {
    const currentProfile = this.getByUserId(userId) ?? this.createDefault(userId);
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...patch,
      preferredGenres: patch.preferredGenres ?? currentProfile.preferredGenres,
    };

    this.profiles.set(userId, updatedProfile);

    return updatedProfile;
  }

  incrementCompletedTrivias(userId: string, incrementBy = 1): UserProfile {
    const currentProfile = this.getByUserId(userId) ?? this.createDefault(userId);
    const updatedProfile: UserProfile = {
      ...currentProfile,
      completedTrivias: currentProfile.completedTrivias + incrementBy,
    };

    this.profiles.set(userId, updatedProfile);

    return updatedProfile;
  }

  private createDefault(userId: string): UserProfile {
    return {
      userId,
      displayName: '',
      bio: '',
      profileImageUrl: '',
      preferredGenres: [],
      completedTrivias: 0,
    };
  }
}
