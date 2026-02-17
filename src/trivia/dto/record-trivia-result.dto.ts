import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class RecordTriviaResultDto {
  @ApiProperty({ example: 5114 })
  @IsInt()
  @Min(1)
  animeId!: number;

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(0)
  correct!: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  total!: number;

  @ApiProperty({ example: 'medium' })
  @IsString()
  @IsNotEmpty()
  difficulty!: string;
}
