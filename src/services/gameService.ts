import api from "@/providers/api";
import type { User } from "@/types/user";

export type AthleteType = "defender" | "midfielder" | "attacker";

export type ApiAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
  ability_id: number;
  tier: string;
  type: AthleteType;
  overall: number;
  cost: number;
  status?: "MARKET" | "OWNED";
};

export type MarketResponse = {
  refresh_cost: number;
  refreshed_at: string | null;
  athletes: ApiAthlete[];
};

export type TeamResponse = {
  id: number;
  name: string;
  round: number;
  victory: number;
  lose: number;
  athletes_count: number;
  max_athletes: number;
  athletes: ApiAthlete[];
} | null;

export type BuyAthleteResponse = {
  user: {
    id: number;
    coins: number;
  };
  team: {
    id: number;
    athletes_count: number;
  };
  athlete: {
    id: number;
    name: string;
    cost: number;
    tier: string;
    type: AthleteType;
  };
};

export type SellAthleteResponse = {
  user: {
    id: number;
    coins: number;
  };
  team: {
    id: number;
    athletes_count: number;
  };
  athlete: {
    id: number;
    name: string;
    refund: number;
    tier: string;
    type: AthleteType;
  };
};

export type MatchPositionPayload = {
  athleteId: number;
  posX: number;
  posY: number;
};

export type SnapshotAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
};

export type SnapshotPositions = Array<Array<SnapshotAthlete | null>>;

export type MatchEvent = {
  turn: number;
  possession: "player" | "opponent";
  ballRow: 0 | 1 | 2;
  kind: "pass" | "tackle" | "shot" | "turnover";
  attackerTeamId: number;
  defenderTeamId: number;
  attackerId: number | null;
  attackerName: string | null;
  defenderId: number | null;
  defenderName: string | null;
  attackerRoll: number;
  defenderRoll: number;
  success: boolean;
  goal: boolean;
  description: string;
};

export type MatchResponse = {
  lineups: {
    player: {
      snapshotId: number;
      teamId: number;
      name: string;
      positions: SnapshotPositions;
    };
    opponent: {
      snapshotId: number;
      teamId: number;
      name: string;
      positions: SnapshotPositions;
    };
  };
  score: {
    player: number;
    opponent: number;
  };
  winner: "player" | "opponent" | "draw";
  totalTurns: number;
  events: MatchEvent[];
  persisted: {
    teamId: number;
    victory: number;
    lose: number;
    round: number;
  };
  resolution: {
    matchStatus: "in_progress" | "won" | "lost";
    matchEnded: boolean;
    trophiesDelta: number;
    trophies: number;
    coinsEarned: number;
    coins: number;
    userVictory: number;
    userDefeat: number;
    isGuest: boolean;
    roundLogId: number;
  };
};

export const gameService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  getMarket: async (): Promise<MarketResponse> => {
    const response = await api.get<MarketResponse>("/mercado");
    return response.data;
  },

  refreshMarket: async (): Promise<MarketResponse> => {
    const response = await api.post<MarketResponse>("/mercado/refresh");
    return response.data;
  },

  getTeam: async (): Promise<TeamResponse> => {
    const response = await api.get<TeamResponse>("/equipe");
    return response.data;
  },

  buyAthlete: async (athleteId: number): Promise<BuyAthleteResponse> => {
    const response = await api.post<BuyAthleteResponse>("/equipe/comprar-atleta", {
      atleta_id: athleteId,
    });
    return response.data;
  },

  sellAthlete: async (athleteId: number): Promise<SellAthleteResponse> => {
    const response = await api.post<SellAthleteResponse>("/equipe/vender-atleta", {
      atleta_id: athleteId,
    });
    return response.data;
  },

  playMatch: async (
    positions: MatchPositionPayload[]
  ): Promise<MatchResponse> => {
    const response = await api.post<MatchResponse>("/partida/jogar", {
      positions,
    });
    return response.data;
  },
};
