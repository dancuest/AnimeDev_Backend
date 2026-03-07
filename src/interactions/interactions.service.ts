import { BadRequestException, Injectable } from '@nestjs/common';
import { InteractionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateInteractionDto) {
    if (dto.type === InteractionType.TRIVIA_SCORE) {
      const score = dto.payload?.score;
      const total = dto.payload?.total;

      if (typeof score !== 'number' || typeof total !== 'number') {
        throw new BadRequestException(
          'TRIVIA_SCORE payload must include numeric score and total',
        );
      }
    }

    return this.prisma.userInteraction.create({
      data: {
        userId,
        animeId: dto.animeId,
        type: dto.type,
        // payload is validated earlier as object but Prisma expects a more
        // specific Json union type. Cast to any to appease the compiler.
        payload: dto.payload as any,
      },
    });
  }

  async listMine(userId: string, limit = 50) {
    return this.prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
