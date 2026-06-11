import { describe, expect, it } from "vitest";

import {
  calculateWinRate,
  isPercentageMetric,
  metricValue,
  type RankingChartEntry,
  sortByMetric,
  topEntries,
  toMetricChartData,
  toResultsChartData,
} from "./rankingCharts";

const entry = (
  nickname: string,
  trophies: number,
  victory: number,
  defeat: number,
): RankingChartEntry => ({ nickname, trophies, victory, defeat });

const players: RankingChartEntry[] = [
  entry("bruna", 120, 8, 2),
  entry("carlos", 300, 10, 10),
  entry("ana", 250, 12, 4),
  entry("diego", 90, 2, 6),
  entry("elisa", 180, 6, 3),
  entry("fabio", 60, 1, 9),
];

describe("calculateWinRate", () => {
  it("retorna 0 quando o jogador nao tem campanhas", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it("calcula o percentual com 1 casa decimal como o backend", () => {
    expect(calculateWinRate(2, 1)).toBe(66.7);
    expect(calculateWinRate(8, 2)).toBe(80);
    expect(calculateWinRate(0, 5)).toBe(0);
  });
});

describe("metricValue", () => {
  it("resolve o campo correto para cada metrica", () => {
    const player = entry("ana", 250, 12, 4);
    expect(metricValue(player, "trophies")).toBe(250);
    expect(metricValue(player, "victories")).toBe(12);
    expect(metricValue(player, "winRate")).toBe(75);
  });
});

describe("isPercentageMetric", () => {
  it("marca apenas aproveitamento como percentual", () => {
    expect(isPercentageMetric("winRate")).toBe(true);
    expect(isPercentageMetric("trophies")).toBe(false);
    expect(isPercentageMetric("victories")).toBe(false);
  });
});

describe("sortByMetric", () => {
  it("ordena decrescente por trofeus sem mutar a lista original", () => {
    const original = [...players];
    const sorted = sortByMetric(players, "trophies");

    expect(sorted.map((p) => p.nickname)).toEqual([
      "carlos",
      "ana",
      "elisa",
      "bruna",
      "diego",
      "fabio",
    ]);
    expect(players).toEqual(original);
  });

  it("ordena por aproveitamento quando a metrica e winRate", () => {
    const sorted = sortByMetric(players, "winRate");

    expect(sorted.map((p) => p.nickname)).toEqual([
      "bruna",
      "ana",
      "elisa",
      "carlos",
      "diego",
      "fabio",
    ]);
  });

  it("desempata por trofeus e depois por nickname", () => {
    const tied = [
      entry("zeca", 100, 5, 5),
      entry("alice", 100, 5, 5),
      entry("mira", 200, 5, 5),
    ];

    expect(sortByMetric(tied, "victories").map((p) => p.nickname)).toEqual([
      "mira",
      "alice",
      "zeca",
    ]);
  });
});

describe("topEntries", () => {
  it("limita ao top N apos ordenar", () => {
    const top = topEntries(players, "trophies", 2);
    expect(top.map((p) => p.nickname)).toEqual(["carlos", "ana"]);
  });

  it("retorna todos quando ha menos jogadores que o limite", () => {
    const top = topEntries(players.slice(0, 3), "trophies", 10);
    expect(top).toHaveLength(3);
  });
});

describe("toMetricChartData", () => {
  it("formata top N por trofeus no shape do recharts", () => {
    expect(toMetricChartData(players, "trophies", 3)).toEqual([
      { nickname: "carlos", value: 300 },
      { nickname: "ana", value: 250 },
      { nickname: "elisa", value: 180 },
    ]);
  });

  it("usa o aproveitamento calculado como valor para winRate", () => {
    expect(toMetricChartData(players, "winRate", 2)).toEqual([
      { nickname: "bruna", value: 80 },
      { nickname: "ana", value: 75 },
    ]);
  });

  it("retorna lista vazia para ranking vazio", () => {
    expect(toMetricChartData([], "trophies", 10)).toEqual([]);
  });
});

describe("toResultsChartData", () => {
  it("retorna vitorias e derrotas dos 5 primeiros por trofeus", () => {
    expect(toResultsChartData(players)).toEqual([
      { nickname: "carlos", victories: 10, defeats: 10 },
      { nickname: "ana", victories: 12, defeats: 4 },
      { nickname: "elisa", victories: 6, defeats: 3 },
      { nickname: "bruna", victories: 8, defeats: 2 },
      { nickname: "diego", victories: 2, defeats: 6 },
    ]);
  });

  it("aceita limite customizado menor que o padrao", () => {
    expect(toResultsChartData(players, 2)).toEqual([
      { nickname: "carlos", victories: 10, defeats: 10 },
      { nickname: "ana", victories: 12, defeats: 4 },
    ]);
  });
});
