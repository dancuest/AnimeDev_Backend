export enum DurationType {
  SHORT = 'SHORT',
  MEDIUM = 'MEDIUM',
  LONG = 'LONG',
}

export enum AiringStatus {
  ON_AIR = 'ON_AIR',
  FINISHED = 'FINISHED',
  UPCOMING = 'UPCOMING',
  UNKNOWN = 'UNKNOWN',
}

export interface AnimeDto {
  id: number;
  title: string;
  originalTitle: string | null;
  synopsis: string;
  imageUrl: string;
  mangaPlusSearchUrl: string;
  episodeCount: number | null;
  durationType: DurationType;
  airingStatus: AiringStatus;
  releaseYear: number | null;
  genres: string[];
  score: number | null;
  rating: string | null;
  season: string | null;
  studios: string[];
  trailerUrl: string | null;
}
