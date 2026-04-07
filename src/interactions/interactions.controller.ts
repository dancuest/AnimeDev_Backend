import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionsService } from './interactions.service';
import {
  InteractionCreateResponseDto,
  InteractionRecordResponseDto,
} from './dto/interactions-swagger.dto';

@ApiTags('interactions')
@ApiBearerAuth('access-token')
@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user interaction for an anime' })
  @ApiCreatedResponse({
    type: InteractionCreateResponseDto,
    description: 'Returns confirmation plus the stored interaction',
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or payload does not match interaction type',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  create(
    @Req() req: Request & { user?: { userId: string } },
    @Body() dto: CreateInteractionDto,
  ) {
    return this.interactionsService.create(req.user!.userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List current user interactions' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 50,
    description: 'Maximum number of interactions to return',
  })
  @ApiOkResponse({
    type: InteractionRecordResponseDto,
    isArray: true,
    description: 'Returns current user interactions ordered by recency',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  listMine(
    @Req() req: Request & { user?: { userId: string } },
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.interactionsService.listMine(req.user!.userId, limit);
  }
}