// Tipos espelhando os payloads reais do backend (server/src/modules).

export type AthleteType = "goalkeeper" | "defender" | "attacker";

/** Atleta como retornado por /mercado e /equipe. */
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
};

/** Entrada do mercado (atleta + status de posse). */
export type MarketAthlete = ApiAthlete & {
  status: "MARKET" | "OWNED";
};

export type MarketResponse = {
  refresh_cost: number;
  refreshed_at: string | null;
  athletes: MarketAthlete[];
};

export type TeamAthlete = ApiAthlete;

export type TeamResponse = {
  id: number;
  name: string;
  round: number;
  victory: number;
  lose: number;
  athletes_count: number;
  max_athletes: number;
  athletes: TeamAthlete[];
} | null;

/** Item da loja (GET /itens). */
export type ShopItem = {
  id: number;
  name: string;
  description: string;
  cost: number;
  stackable: boolean;
  modifiers: { attack: number; defense: number; velocity: number };
};

/** Posicao enviada em /equipe/salvar-estado (grid 3x3, posX/posY de 0 a 2). */
export type AthletePosition = {
  athleteId: number;
  posX: number;
  posY: number;
};
