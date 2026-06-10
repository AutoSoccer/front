import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/providers/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/providers/api";
import { gameService } from "./gameService";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe("gameService.getCurrentUser", () => {
  it("chama GET /auth/me e retorna user", async () => {
    const user = { id: 1, nickname: "u1" };
    mockedApi.get.mockResolvedValueOnce({ data: user });

    const result = await gameService.getCurrentUser();

    expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(user);
  });
});

describe("gameService.getTeam", () => {
  it("chama GET /team e retorna team", async () => {
    const team = {
      id: 1,
      name: "Time A",
      round: 0,
      victory: 0,
      lose: 0,
      athletes_count: 0,
      max_athletes: 9,
      athletes: [],
    };
    mockedApi.get.mockResolvedValueOnce({ data: team });

    const result = await gameService.getTeam();

    expect(mockedApi.get).toHaveBeenCalledWith("/team");
    expect(result).toEqual(team);
  });

  it("retorna null quando backend responde null", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: null });
    const result = await gameService.getTeam();
    expect(result).toBeNull();
  });
});

describe("gameService.buyAthlete", () => {
  it("envia atleta_id no body para /team/buy-athlete", async () => {
    const fake = {
      data: {
        user: { id: 1, coins: 5 },
        team: { id: 1, athletes_count: 1 },
        athlete: { id: 42, name: "X", cost: 5, tier: "C", type: "attacker" },
      },
    };
    mockedApi.post.mockResolvedValueOnce(fake);

    const result = await gameService.buyAthlete(42);

    expect(mockedApi.post).toHaveBeenCalledWith("/team/buy-athlete", {
      atleta_id: 42,
    });
    expect(result).toEqual(fake.data);
  });
});

describe("gameService.sellAthlete", () => {
  it("envia atleta_id no body para /team/sell-athlete", async () => {
    const fake = {
      data: {
        user: { id: 1, coins: 8 },
        team: { id: 1, athletes_count: 0 },
        athlete: {
          id: 42,
          name: "X",
          refund: 3,
          tier: "C",
          type: "defender",
        },
      },
    };
    mockedApi.post.mockResolvedValueOnce(fake);

    const result = await gameService.sellAthlete(42);

    expect(mockedApi.post).toHaveBeenCalledWith("/team/sell-athlete", {
      atleta_id: 42,
    });
    expect(result).toEqual(fake.data);
  });
});

describe("gameService.getMarket", () => {
  it("chama GET /market e retorna market", async () => {
    const market = {
      refresh_cost: 1,
      refreshed_at: null,
      coins: 10,
      athletes: [],
    };
    mockedApi.get.mockResolvedValueOnce({ data: market });

    const result = await gameService.getMarket();

    expect(mockedApi.get).toHaveBeenCalledWith("/market");
    expect(result).toEqual(market);
  });
});

describe("gameService.refreshMarket", () => {
  it("chama POST /market/refresh e retorna market", async () => {
    const market = {
      refresh_cost: 1,
      refreshed_at: "2026-06-09T00:00:00Z",
      coins: 9,
      athletes: [],
    };
    mockedApi.post.mockResolvedValueOnce({ data: market });

    const result = await gameService.refreshMarket();

    expect(mockedApi.post).toHaveBeenCalledWith("/market/refresh");
    expect(result).toEqual(market);
  });
});

describe("gameService.abandonCampaign", () => {
  it("chama POST /match/abandon", async () => {
    const fake = {
      data: {
        user: { id: 1, coins: 10, trophies: 0 },
        team: null,
      },
    };
    mockedApi.post.mockResolvedValueOnce(fake);

    const result = await gameService.abandonCampaign();

    expect(mockedApi.post).toHaveBeenCalledWith("/match/abandon");
    expect(result).toEqual(fake.data);
  });
});

describe("gameService.startCampaign", () => {
  it("envia name no body para /match/start", async () => {
    const fake = {
      data: {
        user: { id: 1, coins: 10, trophies: 0 },
        team: {
          id: 1,
          name: "Time X",
          round: 0,
          victory: 0,
          lose: 0,
          draw: 0,
          athletesCount: 0,
        },
      },
    };
    mockedApi.post.mockResolvedValueOnce(fake);

    const result = await gameService.startCampaign("Time X");

    expect(mockedApi.post).toHaveBeenCalledWith("/match/start", {
      name: "Time X",
    });
    expect(result).toEqual(fake.data);
  });
});

describe("gameService.playMatch", () => {
  it("envia positions no body para /match/play", async () => {
    const positions = [
      { athleteId: 1, posX: 0, posY: 0 },
      { athleteId: 2, posX: 1, posY: 2 },
    ];
    const fake = { data: { events: [], score: { player: 1, opponent: 0 } } };
    mockedApi.post.mockResolvedValueOnce(fake);

    const result = await gameService.playMatch(positions);

    expect(mockedApi.post).toHaveBeenCalledWith("/match/play", { positions });
    expect(result).toEqual(fake.data);
  });

  it("propaga erro do api.post", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("erro"));
    await expect(gameService.playMatch([])).rejects.toThrow("erro");
  });
});
