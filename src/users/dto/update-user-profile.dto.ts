import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'OtakuMX' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Fan de shonen y slice of life.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.animedev.com/profiles/otaku.png' })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['Action', 'Comedy'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredGenres?: string[];
}
