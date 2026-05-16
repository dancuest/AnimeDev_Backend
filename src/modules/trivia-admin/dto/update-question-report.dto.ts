import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuestionReportDto {
  @IsOptional()
  @IsIn(['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'])
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}