import { ApiProperty } from '@nestjs/swagger';

export class TriviaRecordResponseDto {
  @ApiProperty({ example: 'Resultado registrado correctamente.' })
  message!: string;

  @ApiProperty({ example: 5 })
  completedTrivias!: number;
}
