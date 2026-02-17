import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserId, USER_ID_HEADER } from '../common/auth/current-user-id.decorator';
import { RecordTriviaResultDto } from './dto/record-trivia-result.dto';
import { TriviaRecordResponseDto } from './dto/trivia-record-response.dto';
import { TriviaStatsDto } from './dto/trivia-stats.dto';
import { TriviaService } from './trivia.service';

@ApiTags('trivia')
@Controller('trivia')
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post('record')
  @ApiOperation({ summary: `Record trivia result (use ${USER_ID_HEADER} header)` })
  @ApiOkResponse({ type: TriviaRecordResponseDto })
  record(
    @CurrentUserId() userId: string,
    @Body() body: RecordTriviaResultDto,
  ): TriviaRecordResponseDto {
    return this.triviaService.recordResult(userId, body);
  }

  @Get('stats')
  @ApiOperation({ summary: `Get current user trivia stats (use ${USER_ID_HEADER} header)` })
  @ApiOkResponse({ type: TriviaStatsDto })
  stats(@CurrentUserId() userId: string): TriviaStatsDto {
    return this.triviaService.getStats(userId);
  }
}
