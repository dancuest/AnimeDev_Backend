import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnimeService } from '../anime/anime.service';
import { AnimeDto } from '../anime/dto/anime.dto';
import { calculateCosineSimilarity } from './algorithms/cosine-similarity.util';
import { InteractionType } from '@prisma/client';

@Injectable()
export class RecommendationsService {
    private readonly logger = new Logger(RecommendationsService.name);

    // Weights for interactions
    private readonly WEIGHTS: Record<InteractionType, number> = {
        FAVORITE: 5,
        VIEW: 1,
        TRIVIA_SCORE: 0, // Calculated dynamically
        DISLIKE: -3,
        UNFAVORITE: -2,
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly animeService: AnimeService,
    ) { }

    async getAdaptiveRecommendations(userId: string, requestId?: string) {
        // 1. Fetch all interactions
        const allInteractions = await this.prisma.userInteraction.findMany();

        // Safety check, if no data return top anime
        if (allInteractions.length < 5) {
            this.logger.debug('Not enough data for Collaborative Filtering, returning fallback (Top Anime)');
            return this.animeService.getTop(10, requestId);
        }

        // 2. Build User-Item Matrix
        // Structure: userVectors[userId][animeId] = cumulativeScore
        const userVectors = new Map<string, Map<number, number>>();

        for (const record of allInteractions) {
            if (!userVectors.has(record.userId)) {
                userVectors.set(record.userId, new Map<number, number>());
            }

            const animeScores = userVectors.get(record.userId)!;
            let scoreToAdd = this.WEIGHTS[record.type];

            // Dynamic score for Trivia (e.g: payload { score: 8 } -> scoreToAdd = 4)
            if (record.type === 'TRIVIA_SCORE' && record.payload && typeof record.payload === 'object') {
                const payloadData = record.payload as any;
                if (payloadData.score !== undefined) {
                    scoreToAdd = payloadData.score / 2;
                } else {
                    scoreToAdd = 2; // default avg trivia fallback
                }
            }

            const currentScore = animeScores.get(record.animeId) || 0;
            animeScores.set(record.animeId, currentScore + scoreToAdd);
        }

        const currentUserVector = userVectors.get(userId);

        // If the requesting user has no interactions, return top anime
        if (!currentUserVector || currentUserVector.size === 0) {
            this.logger.debug(`User ${userId} has no interactions, returning Top Anime`);
            return this.animeService.getTop(10, requestId);
        }

        // 3. Find Similarities using Cosine Similarity
        // Compare currentUserVector against all other users
        const userSimilarities = new Map<string, number>();

        for (const [otherUserId, otherUserVector] of userVectors.entries()) {
            if (otherUserId !== userId) {
                const similarity = calculateCosineSimilarity(currentUserVector, otherUserVector);
                userSimilarities.set(otherUserId, similarity);
            }
        }

        // 4. Generate Predictions for unseen Animes
        // We look at animes the user HAS NOT interacted with, but similar users HAVE.
        const predictedScores = new Map<number, number>();

        for (const [otherUserId, similarity] of userSimilarities.entries()) {
            if (similarity <= 0) continue; // Only consider users with positive correlation

            const otherUserVector = userVectors.get(otherUserId)!;

            for (const [animeId, score] of otherUserVector.entries()) {
                // Skip if current user already interacted with this anime
                if (currentUserVector.has(animeId)) continue;

                const weightedScore = score * similarity;
                const currentTotal = predictedScores.get(animeId) || 0;
                predictedScores.set(animeId, currentTotal + weightedScore);
            }
        }

        // 5. Sort by Top N
        const sortedAnimes = Array.from(predictedScores.entries())
            .sort((a, b) => b[1] - a[1]) // Descending
            .slice(0, 10)
            .map(entry => entry[0]);

        // Format output exactly as top/search
        if (sortedAnimes.length === 0) {
            this.logger.debug(`No recommendations found after CF, returning Top Anime`);
            return this.animeService.getTop(10, requestId);
        }

        // Resolve detailed AnimeDto based on IDs
        const recommendedList: AnimeDto[] = [];
        for (const animeId of sortedAnimes) {
            try {
                const animeDetails = await this.animeService.getById(animeId, requestId);
                if (animeDetails && animeDetails.data) {
                    recommendedList.push(animeDetails.data);
                }
            } catch (err) {
                this.logger.warn(`Failed to fetch anime ${animeId} details: ${err}`);
            }
        }

        return {
            data: recommendedList,
            meta: {
                algorithm: 'cosine_similarity',
                count: recommendedList.length
            }
        };
    }
}
