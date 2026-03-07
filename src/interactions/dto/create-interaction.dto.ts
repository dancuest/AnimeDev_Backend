import { InteractionType } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class CreateInteractionDto {
  @IsInt()
  @Min(1)
  animeId!: number;

  @IsEnum(InteractionType)
  type!: InteractionType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
