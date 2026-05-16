import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQuestionReportDto } from './dto/create-question-report.dto';
import { UpdateQuestionReportDto } from './dto/update-question-report.dto';
import { UpsertTriviaQuestionDto } from './dto/upsert-trivia-question.dto';

@Injectable()
export class TriviaAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestionReport(userId: string, dto: CreateQuestionReportDto) {
    const reason = dto.reason.trim();
    const questionText = dto.questionText.trim();

    if (reason.length < 8) {
      throw new BadRequestException('La queja debe tener al menos 8 caracteres');
    }

    if (!questionText) {
      throw new BadRequestException('La pregunta reportada es obligatoria');
    }

    return this.prisma.triviaQuestionReport.create({
      data: {
        questionId: dto.questionId,
        animeId: dto.animeId ?? null,
        animeTitle: dto.animeTitle?.trim() || null,
        questionText,
        reason,
        reporterUserId: userId,
        status: 'PENDING',
      },
    });
  }

  async listQuestionReports(userId: string, status?: string) {
    await this.assertAdmin(userId);

    const where =
      status && status !== 'ALL'
        ? { status }
        : {};

    return this.prisma.triviaQuestionReport.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  async updateQuestionReport(
    userId: string,
    reportId: string,
    dto: UpdateQuestionReportDto,
  ) {
    await this.assertAdmin(userId);

    const existing = await this.prisma.triviaQuestionReport.findUnique({
      where: { id: reportId },
    });

    if (!existing) {
      throw new NotFoundException('Queja no encontrada');
    }

    const nextStatus = dto.status ?? existing.status;
    const isClosing = ['RESOLVED', 'REJECTED'].includes(nextStatus);

    return this.prisma.triviaQuestionReport.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
        adminNote: dto.adminNote?.trim() || existing.adminNote,
        resolvedByUserId: isClosing ? userId : existing.resolvedByUserId,
        resolvedAt: isClosing ? new Date() : existing.resolvedAt,
      },
    });
  }

  async searchAnime(userId: string, query: string) {
    await this.assertAdmin(userId);

    const q = query?.trim();

    if (!q || q.length < 2) {
      return [];
    }

    const animeDelegate = (this.prisma as any).anime;

    return animeDelegate.findMany({
      where: {
        OR: [
          {
            title: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            originalTitle: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        externalApiId: true,
        title: true,
        originalTitle: true,
        coverImageUrl: true,
        totalEpisodes: true,
        releaseYear: true,
      },
      orderBy: {
        title: 'asc',
      },
      take: 25,
    });
  }

  async listQuestionsByAnime(userId: string, animeId: number) {
    await this.assertAdmin(userId);

    if (!animeId || animeId <= 0) {
      throw new BadRequestException('animeId inválido');
    }

    const triviaQuestionDelegate = (this.prisma as any).triviaQuestion;

    return triviaQuestionDelegate.findMany({
      where: {
        animeId,
      },
      orderBy: [
        {
          difficulty: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async createQuestionAsAdmin(userId: string, dto: UpsertTriviaQuestionDto) {
    await this.assertAdmin(userId);

    this.validateQuestionPayload(dto, true);

    const triviaQuestionDelegate = (this.prisma as any).triviaQuestion;

    return triviaQuestionDelegate.create({
      data: {
        animeId: dto.animeId,
        externalAnimeId: dto.externalAnimeId ?? String(dto.animeId),
        question: dto.question!.trim(),
        options: dto.options,
        correctAnswerIndex: dto.correctAnswerIndex,
        difficulty: dto.difficulty,
        category: dto.category?.trim() || 'GENERAL',
        explanation: dto.explanation?.trim() || '',
        status: dto.status ?? 'APPROVED',
      },
    });
  }

  async listQuestionsForAdmin(userId: string, status?: string) {
  await this.assertAdmin(userId);

  const triviaQuestionDelegate = (this.prisma as any).triviaQuestion;

  const where =
    status && status !== 'ALL'
      ? { status }
      : {};

  return triviaQuestionDelegate.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
  });
}

  async updateQuestion(
    userId: string,
    questionId: string,
    dto: UpsertTriviaQuestionDto,
  ) {
    await this.assertAdmin(userId);

    const data: Record<string, unknown> = {};

    if (dto.animeId !== undefined) data.animeId = dto.animeId;
    if (dto.externalAnimeId !== undefined) data.externalAnimeId = dto.externalAnimeId;
    if (dto.question !== undefined) data.question = dto.question.trim();
    if (dto.options !== undefined) data.options = dto.options;
    if (dto.correctAnswerIndex !== undefined) data.correctAnswerIndex = dto.correctAnswerIndex;
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.category !== undefined) data.category = dto.category.trim();
    if (dto.explanation !== undefined) data.explanation = dto.explanation.trim();
    if (dto.status !== undefined) data.status = dto.status;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    if (dto.options && dto.correctAnswerIndex !== undefined) {
      this.validateCorrectAnswerIndex(dto.options, dto.correctAnswerIndex);
    }

    const triviaQuestionDelegate = (this.prisma as any).triviaQuestion;

    try {
      return await triviaQuestionDelegate.update({
        where: this.buildQuestionWhere(questionId),
        data,
      });
    } catch {
      throw new NotFoundException('Pregunta no encontrada');
    }
  }

  async deleteQuestion(userId: string, questionId: string) {
    await this.assertAdmin(userId);

    const triviaQuestionDelegate = (this.prisma as any).triviaQuestion;

    try {
      const deleted = await triviaQuestionDelegate.delete({
        where: this.buildQuestionWhere(questionId),
      });

      return {
        success: true,
        message: 'Pregunta eliminada correctamente',
        question: deleted,
      };
    } catch {
      throw new NotFoundException('Pregunta no encontrada');
    }
  }

  private validateQuestionPayload(dto: UpsertTriviaQuestionDto, requireAll: boolean) {
    if (requireAll) {
      if (!dto.animeId) throw new BadRequestException('animeId es obligatorio');
      if (!dto.question?.trim()) throw new BadRequestException('question es obligatorio');
      if (!dto.options || dto.options.length !== 4) {
        throw new BadRequestException('options debe tener exactamente 4 opciones');
      }
      if (dto.correctAnswerIndex === undefined) {
        throw new BadRequestException('correctAnswerIndex es obligatorio');
      }
      if (!dto.difficulty) throw new BadRequestException('difficulty es obligatorio');
    }

    if (dto.options && dto.correctAnswerIndex !== undefined) {
      this.validateCorrectAnswerIndex(dto.options, dto.correctAnswerIndex);
    }
  }

  private validateCorrectAnswerIndex(options: string[], correctAnswerIndex: number) {
    if (!Array.isArray(options) || options.length !== 4) {
      throw new BadRequestException('La pregunta debe tener exactamente 4 opciones');
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      throw new BadRequestException('correctAnswerIndex debe estar entre 0 y 3');
    }

    const normalized = options.map((option) => option.trim()).filter(Boolean);

    if (normalized.length !== 4) {
      throw new BadRequestException('Todas las opciones deben tener texto');
    }
  }

  private buildQuestionWhere(questionId: string) {
    const numericId = Number(questionId);

    if (Number.isInteger(numericId) && String(numericId) === questionId.trim()) {
      return { id: numericId } as any;
    }

    return { id: questionId } as any;
  }

  private async assertAdmin(userId: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Solo un administrador puede realizar esta acción');
    }

    return user;
  }
}