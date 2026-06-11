import "@/__tests__/mocks/router";

import { beforeAll, describe, expect, it } from "vitest";

import {
  fireEvent,
  renderWithProviders,
  screen,
} from "@/__tests__/utils/renderWithProviders";
import type { RankingEntry } from "@/services/rankingService";

import RankingDashboard from "./RankingDashboard";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === "undefined") {
    globalThis.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  }
});

function buildEntry(overrides: Partial<RankingEntry> = {}): RankingEntry {
  const base: RankingEntry = {
    position: 1,
    userId: 1,
    nickname: "ana",
    trophies: 250,
    victory: 12,
    defeat: 4,
    completedCampaigns: 16,
    winRate: 75,
    lossRate: 25,
  };
  return { ...base, ...overrides };
}

const entries: RankingEntry[] = [
  buildEntry(),
  buildEntry({
    position: 2,
    userId: 2,
    nickname: "bruno",
    trophies: 200,
    victory: 8,
    defeat: 2,
  }),
  buildEntry({
    position: 3,
    userId: 3,
    nickname: "carla",
    trophies: 150,
    victory: 6,
    defeat: 6,
  }),
];

describe("RankingDashboard", () => {
  it("renderiza titulos dos graficos e filtros do painel", () => {
    renderWithProviders(<RankingDashboard entries={entries} />);

    expect(screen.getByText("Análise do ranking")).toBeInTheDocument();
    expect(screen.getByText("Top 10 por Troféus")).toBeInTheDocument();
    expect(screen.getByText("Vitórias x derrotas — top 5")).toBeInTheDocument();
    expect(screen.getByText("Métrica")).toBeInTheDocument();
    expect(screen.getByText("Jogadores")).toBeInTheDocument();
  });

  it("nao renderiza nada quando o ranking esta vazio", () => {
    const { container } = renderWithProviders(
      <RankingDashboard entries={[]} />,
    );

    expect(container.querySelector("section")).toBeNull();
    expect(screen.queryByText("Análise do ranking")).not.toBeInTheDocument();
  });

  it("atualiza o titulo do grafico ao trocar a metrica", () => {
    renderWithProviders(<RankingDashboard entries={entries} />);

    fireEvent.click(screen.getByRole("radio", { name: "Aproveitamento" }));

    expect(screen.getByText("Top 10 por Aproveitamento")).toBeInTheDocument();
  });

  it("expoe o painel como regiao acessivel com aria-label", () => {
    renderWithProviders(<RankingDashboard entries={entries} />);

    expect(
      screen.getByRole("region", { name: "Painel gerencial do ranking" }),
    ).toBeInTheDocument();
  });
});
