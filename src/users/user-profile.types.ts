import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  profileImageUrl: string;
  preferredGenres: string[];
  completedTrivias: number;
}

export interface UserProfileRepository {
  getByUserId(userId: string): UserProfile | undefined;
  save(profile: UserProfile): UserProfile;
  patch(userId: string, patch: UpdateUserProfileDto): UserProfile;
  incrementCompletedTrivias(userId: string, incrementBy?: number): UserProfile;
}
