import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'OtakuMX' })
  displayName!: string;

  @ApiProperty({ example: 'Fan de shonen y slice of life.' })
  bio!: string;

  @ApiProperty({ example: 'https://cdn.animedev.com/profiles/otaku.png' })
  profileImageUrl!: string;

  @ApiProperty({ type: [String], example: ['Action', 'Comedy'] })
  preferredGenres!: string[];

  @ApiProperty({ example: 3 })
  completedTrivias!: number;
}
