import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/providers/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from "@/providers/api";
import { rankingService } from "./rankingService";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe("rankingService.getRanking", () => {
  const fakeRanking = {
    ranking: [
      {
        position: 1,
        userId: 1,
        nickname: "u1",
        trophies: 100,
        victory: 10,
        defeat: 1,
        completedCampaigns: 1,
        winRate: 0.9,
        lossRate: 0.1,
      },
    ],
    currentUser: {
      userId: 1,
      nickname: "u1",
      isGuest: false,
      position: 1,
      appearsInRanking: true,
      trophies: 100,
      victory: 10,
      defeat: 1,
      completedCampaigns: 1,
      winRate: 0.9,
      lossRate: 0.1,
    },
  };

  it("usa limit default 50 quando nao passado", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: fakeRanking });

    const result = await rankingService.getRanking();

    expect(mockedApi.get).toHaveBeenCalledWith("/ranking", {
      params: { limit: 50 },
    });
    expect(result).toEqual(fakeRanking);
  });

  it("usa limit customizado quando passado", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: fakeRanking });

    await rankingService.getRanking(10);

    expect(mockedApi.get).toHaveBeenCalledWith("/ranking", {
      params: { limit: 10 },
    });
  });

  it("propaga erro do api.get", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("falhou"));
    await expect(rankingService.getRanking()).rejects.toThrow("falhou");
  });
});
