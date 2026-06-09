import api from "@/providers/api";

export type RankingMetrics = {
  trophies: number;
  victory: number;
  defeat: number;
  completedCampaigns: number;
  winRate: number;
  lossRate: number;
};

export type RankingEntry = RankingMetrics & {
  position: number;
  userId: number;
  nickname: string;
};

export type CurrentUserRanking = RankingMetrics & {
  userId: number;
  nickname: string;
  isGuest: boolean;
  position: number | null;
  appearsInRanking: boolean;
};

export type RankingResponse = {
  ranking: RankingEntry[];
  currentUser: CurrentUserRanking;
};

export const rankingService = {
  getRanking: async (limit = 50): Promise<RankingResponse> => {
    const response = await api.get<RankingResponse>("/ranking", {
      params: { limit },
    });
    return response.data;
  },
};
