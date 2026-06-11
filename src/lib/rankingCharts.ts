import type { RankingEntry } from "@/services/rankingService";

/**
 * Transformacoes puras usadas pelo RankingDashboard. Mantidas fora do
 * componente para permitir teste unitario sem renderizar SVG do recharts.
 */

export type RankingChartEntry = Pick<
  RankingEntry,
  "nickname" | "trophies" | "victory" | "defeat"
>;

export const chartMetrics = ["trophies", "victories", "winRate"] as const;
export type ChartMetric = (typeof chartMetrics)[number];

export const topNOptions = [5, 10, 20] as const;
export type TopNOption = (typeof topNOptions)[number];

export const RESULTS_CHART_LIMIT = 5;

export type MetricChartDatum = {
  nickname: string;
  value: number;
};

export type ResultsChartDatum = {
  nickname: string;
  victories: number;
  defeats: number;
};

/**
 * Aproveitamento (% de vitorias) com 1 casa decimal — mesma formula do
 * backend (`calculateRankingMetrics`): 0 quando nao ha campanhas.
 */
export function calculateWinRate(victory: number, defeat: number): number {
  const completed = victory + defeat;
  if (completed <= 0) return 0;
  return Math.round((victory / completed) * 1000) / 10;
}

export function metricValue(
  entry: RankingChartEntry,
  metric: ChartMetric,
): number {
  switch (metric) {
    case "trophies":
      return entry.trophies;
    case "victories":
      return entry.victory;
    case "winRate":
      return calculateWinRate(entry.victory, entry.defeat);
  }
}

export function isPercentageMetric(metric: ChartMetric): boolean {
  return metric === "winRate";
}

/**
 * Ordena decrescente pela metrica escolhida sem mutar a lista original.
 * Empates sao resolvidos por trofeus e depois por nickname para manter
 * resultado deterministico.
 */
export function sortByMetric<T extends RankingChartEntry>(
  entries: readonly T[],
  metric: ChartMetric,
): T[] {
  return [...entries].sort((a, b) => {
    const byMetric = metricValue(b, metric) - metricValue(a, metric);
    if (byMetric !== 0) return byMetric;

    const byTrophies = b.trophies - a.trophies;
    if (byTrophies !== 0) return byTrophies;

    return a.nickname.localeCompare(b.nickname);
  });
}

export function topEntries<T extends RankingChartEntry>(
  entries: readonly T[],
  metric: ChartMetric,
  limit: number,
): T[] {
  return sortByMetric(entries, metric).slice(0, Math.max(0, limit));
}

/** Formata os dados do grafico de barras horizontais (top N por metrica). */
export function toMetricChartData(
  entries: readonly RankingChartEntry[],
  metric: ChartMetric,
  limit: number,
): MetricChartDatum[] {
  return topEntries(entries, metric, limit).map((entry) => ({
    nickname: entry.nickname,
    value: metricValue(entry, metric),
  }));
}

/**
 * Formata os dados do comparativo vitorias x derrotas dos lideres do
 * ranking (ordenados por trofeus, como na classificacao oficial).
 */
export function toResultsChartData(
  entries: readonly RankingChartEntry[],
  limit: number = RESULTS_CHART_LIMIT,
): ResultsChartDatum[] {
  return topEntries(entries, "trophies", limit).map((entry) => ({
    nickname: entry.nickname,
    victories: entry.victory,
    defeats: entry.defeat,
  }));
}
