import { Controller, Get, Param, ParseIntPipe, Query, Req } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AnimeService } from './anime.service';
import { AnimeSearchQueryDto, AnimeTopQueryDto } from './dto/anime-query.dto';
import {
  AnimeDetailResponseDto,
  AnimeListResponseDto,
  AnimeSearchResponseDto,
  AnimeSingleResponseDto,
} from './dto/anime-swagger.dto';

@ApiTags('anime')
@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Get('top')
  @ApiOperation({ summary: 'Get top anime list' })
  @ApiOkResponse({
    type: AnimeListResponseDto,
    description: 'Returns top anime with meta wrapper',
  })
  getTop(@Query() query: AnimeTopQueryDto, @Req() req: Request) {
    return this.animeService.getTop(
      query.limit ?? 10,
      req.requestId,
      query.includeAdult,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search anime by text query' })
  @ApiOkResponse({
    type: AnimeSearchResponseDto,
    description: 'Returns anime search results with pagination metadata',
  })
  search(@Query() query: AnimeSearchQueryDto, @Req() req: Request) {
    return this.animeService.search(
      query.q,
      query.limit ?? 10,
      req.requestId,
      query.includeAdult,
    );
  }

  @Get('hero')
  @ApiOperation({ summary: 'Get hero anime for home screen' })
  @ApiOkResponse({
    type: AnimeSingleResponseDto,
    description: 'Returns a single hero anime',
  })
  getHero(@Req() req: Request) {
    return this.animeService.getHero(req.requestId);
  }

  @Get('by-genre/:genreId')
  @ApiOperation({ summary: 'Get anime list filtered by genre id' })
  @ApiParam({
    name: 'genreId',
    example: 1,
    description: 'Anime genre id',
  })
  @ApiOkResponse({
    type: AnimeListResponseDto,
    description: 'Returns anime list filtered by genre with limit metadata',
  })
  getByGenre(
    @Param('genreId', ParseIntPipe) genreId: number,
    @Query() query: AnimeTopQueryDto,
    @Req() req: Request,
  ) {
    return this.animeService.getByGenre(
      String(genreId),
      query.limit ?? 10,
      req.requestId,
      query.includeAdult,
    );
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: 'Get anime detail with cultural notes and trailers',
  })
  @ApiParam({
    name: 'id',
    example: 5114,
    description: 'Anime id',
  })
  @ApiOkResponse({
    type: AnimeDetailResponseDto,
    description: 'Returns anime detail payload',
  })
  getDetail(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.animeService.getDetail(id, req.requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get anime by id' })
  @ApiParam({
    name: 'id',
    example: 5114,
    description: 'Anime id',
  })
  @ApiOkResponse({
    type: AnimeSingleResponseDto,
    description: 'Returns a single anime',
  })
  getById(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.animeService.getById(id, req.requestId);
  }
}