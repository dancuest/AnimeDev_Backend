import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TriviaCategory, TriviaQuestionStatus } from '@prisma/client';
import { AnimeService } from '../../anime/anime.service';
import { CreateQuestionReportDto } from './dto/create-question-report.dto';
import { UpdateQuestionReportDto } from './dto/update-question-report.dto';
import { UpsertTriviaQuestionDto } from './dto/upsert-trivia-question.dto';

@Injectable()
export class TriviaAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly animeService: AnimeService,
  ) {}

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
        ? { status: status as unknown as TriviaQuestionStatus }
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

  async listQuestionsForAdmin(userId: string, status?: string) {
    await this.assertAdmin(userId);

    const where =
      status && status !== 'ALL'
        ? { status: status as unknown as TriviaQuestionStatus }
        : {};

    return this.prisma.triviaQuestion.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });
  }

  async searchAnime(userId: string, query: string) {
    await this.assertAdmin(userId);

    const q = query?.trim();

    if (!q || q.length < 2) {
      return [];
    }

    const result = await this.animeService.search(q, 20);

    return result.data.map((anime) => ({
      id: anime.id,
      externalApiId: anime.externalApiId,
      title: anime.title,
      originalTitle: anime.originalTitle,
      coverImageUrl: anime.coverImageUrl,
      totalEpisodes: anime.totalEpisodes,
      releaseYear: anime.releaseYear,
    }));
  }

  async listQuestionsByAnime(userId: string, animeId: number) {
    await this.assertAdmin(userId);

    if (!animeId || animeId <= 0) {
      throw new BadRequestException('animeId inválido');
    }

    return this.prisma.triviaQuestion.findMany({
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

    return this.prisma.triviaQuestion.create({
      data: {
        animeId: dto.animeId!,
        externalAnimeId: dto.externalAnimeId ?? String(dto.animeId),
        question: dto.question!.trim(),
        options: dto.options!,
        correctAnswerIndex: dto.correctAnswerIndex!,
        difficulty: dto.difficulty!,
        category: (dto.category?.trim() as unknown as TriviaCategory) || TriviaCategory.GENERAL,
        explanation: dto.explanation?.trim() || '',
        status: (dto.status as unknown as TriviaQuestionStatus) ?? TriviaQuestionStatus.APPROVED,
        source: 'OFFICIAL',
        createdByUserId: userId,
        reviewedByUserId: userId,
        reviewedAt: new Date(),
      },
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
    if (dto.status !== undefined) {
      data.status = dto.status;

      if (dto.status === 'APPROVED' || dto.status === 'REJECTED') {
        data.reviewedByUserId = userId;
        data.reviewedAt = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay campos para actualizar');
    }

    if (dto.options && dto.correctAnswerIndex !== undefined) {
      this.validateCorrectAnswerIndex(dto.options, dto.correctAnswerIndex);
    }

    try {
      return await this.prisma.triviaQuestion.update({
        where: {
          id: questionId,
        },
        data,
      });
    } catch {
      throw new NotFoundException('Pregunta no encontrada');
    }
  }

  async deleteQuestion(userId: string, questionId: string) {
    await this.assertAdmin(userId);

    try {
      const deleted = await this.prisma.triviaQuestion.delete({
        where: {
          id: questionId,
        },
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
      if (!dto.animeId) {
        throw new BadRequestException('animeId es obligatorio');
      }

      if (!dto.question?.trim()) {
        throw new BadRequestException('question es obligatorio');
      }

      if (!dto.options || dto.options.length !== 4) {
        throw new BadRequestException('options debe tener exactamente 4 opciones');
      }

      if (dto.correctAnswerIndex === undefined) {
        throw new BadRequestException('correctAnswerIndex es obligatorio');
      }

      if (!dto.difficulty) {
        throw new BadRequestException('difficulty es obligatorio');
      }
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

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
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