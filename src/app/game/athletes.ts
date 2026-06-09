import type { ApiAthlete } from "@/services/gameService";

export type AthleteStats = {
  atk: number;
  vel: number;
  def: number;
  hab: string;
};

export type AthleteMarketItem = {
  id: string;
  athleteId: number;
  name: string;
  icon: string;
  stats: AthleteStats;
  cost: number;
  tier: string;
  type: ApiAthlete["type"];
  status?: ApiAthlete["status"];
};

const ROLE_LABELS: Record<ApiAthlete["type"], string> = {
  defender: "Defesa",
  midfielder: "Meio",
  attacker: "Ataque",
};

export function mapApiAthleteToMarketItem(
  athlete: ApiAthlete
): AthleteMarketItem {
  return {
    id: String(athlete.id),
    athleteId: athlete.id,
    name: athlete.name,
    icon: "/athlete.svg",
    stats: {
      atk: athlete.attack,
      vel: athlete.velocity,
      def: athlete.defense,
      hab: ROLE_LABELS[athlete.type],
    },
    cost: athlete.cost,
    tier: athlete.tier,
    type: athlete.type,
    status: athlete.status,
  };
}

export const athletePool: Array<AthleteMarketItem | null> = [];
