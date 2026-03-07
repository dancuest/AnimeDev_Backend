import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InteractionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInteractionDto) {
    if (dto.animeId <= 0) {
      throw new BadRequestException('animeId must be greater than 0');
    }

    if (dto.type === InteractionType.TRIVIA_SCORE) {
      const score = dto.payload?.score;
      if (typeof score !== 'number' || Number.isNaN(score) || score < 0 || score > 10) {
        throw new BadRequestException(
          'TRIVIA_SCORE payload must include numeric score between 0 and 10',
        );
      }
    }

    const created = await this.prisma.userInteraction.create({
      data: {
        userId,
        animeId: dto.animeId,
        type: dto.type,
        payload: dto.payload as any,
      },
      select: {
        id: true,
        userId: true,
        animeId: true,
        type: true,
        payload: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `Interaction stored user=${userId} anime=${dto.animeId} type=${dto.type} interactionId=${created.id}`,
    );

    return {
      message: 'Interaction registered successfully',
      interaction: created,
    };
  }

  async listMine(userId: string, limit = 50) {
    return this.prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
