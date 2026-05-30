import api from "@/providers/api";
import type {
  AthletePosition,
  MarketResponse,
  ShopItem,
  TeamResponse,
} from "@/types/game";

/**
 * Camada de acesso ao backend para o ciclo de jogo (mercado, equipe, itens).
 * Todas as rotas exigem Bearer token, injetado pelo interceptor em providers/api.
 */
export const gameService = {
  // ----- Equipe (RF007/RF008/RF011) -----
  getTeam: async (): Promise<TeamResponse> => {
    const response = await api.get<TeamResponse>("/equipe");
    return response.data;
  },

  buyAthlete: async (atletaId: number) => {
    const response = await api.post("/equipe/comprar-atleta", {
      atleta_id: atletaId,
    });
    return response.data;
  },

  /** Salva o snapshot imutavel da formacao da rodada (exatamente 6 atletas). */
  salvarEstado: async (positions: AthletePosition[]) => {
    const response = await api.post("/equipe/salvar-estado", { positions });
    return response.data as {
      snapshotId: number;
      teamId: number;
      round: number;
    };
  },

  // ----- Mercado (RF009) -----
  getMarket: async (): Promise<MarketResponse> => {
    const response = await api.get<MarketResponse>("/mercado");
    return response.data;
  },

  refreshMarket: async (): Promise<MarketResponse> => {
    const response = await api.post<MarketResponse>("/mercado/refresh");
    return response.data;
  },

  // ----- Itens (RF014) -----
  getItems: async (): Promise<ShopItem[]> => {
    const response = await api.get<{ items: ShopItem[] }>("/itens");
    return response.data.items;
  },

  buyItem: async (itemId: number) => {
    const response = await api.post("/itens/comprar", { item_id: itemId });
    return response.data;
  },

  applyItem: async (itemId: number, atletaId: number) => {
    const response = await api.post("/itens/aplicar", {
      item_id: itemId,
      atleta_id: atletaId,
    });
    return response.data;
  },
};
