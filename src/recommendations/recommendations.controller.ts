import {
  Controller,
  Get,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsResponseDto } from './dto/recommendations-swagger.dto';

@ApiTags('recommendations')
@ApiBearerAuth('access-token')
@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('adaptive')
  @ApiOperation({
    summary:
      'Get adaptive recommendations using cosine similarity and preference signals',
  })
  @ApiOkResponse({
    type: RecommendationsResponseDto,
    description: 'Returns personalized anime recommendations plus meta strategy',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  async getAdaptiveRecommendations(
    @Req() req: Request & { user?: { userId: string } },
  ) {
    const userId = req.user?.userId;

    if (!userId) {
      throw new HttpException(
        'User not found in request',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const requestId = (req as any).requestId;

    return this.recommendationsService.getAdaptiveRecommendations(
      userId,
      requestId,
    );
  }
}