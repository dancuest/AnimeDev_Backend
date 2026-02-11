import { Controller, Get, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AnimeService } from './anime.service';

@ApiTags('genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly animeService: AnimeService) {}

  @Get()
  @ApiOperation({ summary: 'Get anime genres' })
  @ApiOkResponse({ description: 'Returns list of anime genres.' })
  getGenres(@Req() req: Request) {
    return this.animeService.getGenres(req.requestId);
  }
}
