"use client";

import { Segmented, Select } from "antd";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartMetric,
  chartMetrics,
  isPercentageMetric,
  RESULTS_CHART_LIMIT,
  toMetricChartData,
  topNOptions,
  type TopNOption,
  toResultsChartData,
} from "@/lib/rankingCharts";
import type { RankingEntry } from "@/services/rankingService";

import styles from "./RankingDashboard.module.css";

const axisTick = {
  fill: "var(--text-muted)",
  fontSize: 11,
  fontWeight: 700,
} as const;

const tooltipContentStyle = {
  backgroundColor: "var(--bg-card)",
  border: "2px solid var(--border-arcade)",
  borderRadius: 8,
  color: "var(--text-on-card)",
  fontSize: 12,
  fontWeight: 700,
} as const;

const tooltipLabelStyle = { color: "var(--text-on-card)" } as const;

function atNickname(nickname: string): string {
  return `@${nickname}`;
}

export default function RankingDashboard({
  entries,
}: {
  entries: RankingEntry[];
}) {
  const t = useTranslations("ranking.dashboard");
  const [metric, setMetric] = useState<ChartMetric>("trophies");
  const [topN, setTopN] = useState<TopNOption>(10);

  const metricData = useMemo(
    () => toMetricChartData(entries, metric, topN),
    [entries, metric, topN],
  );
  const resultsData = useMemo(() => toResultsChartData(entries), [entries]);

  if (entries.length === 0) {
    return null;
  }

  const metricLabel = t(`metric.${metric}`);
  const isPercentage = isPercentageMetric(metric);
  const formatMetric = (value: number) =>
    isPercentage ? `${value}%` : `${value}`;

  return (
    <section className={styles.dashboard} aria-label={t("aria")}>
      <header className={styles.dashboardHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>{t("label")}</span>
          <h2>
            <BarChart3 aria-hidden="true" />
            {t("title")}
          </h2>
          <p>{t("subtitle")}</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterField}>
            <span id="ranking-dashboard-metric-label">
              {t("filters.metric")}
            </span>
            <Segmented<ChartMetric>
              options={chartMetrics.map((option) => ({
                value: option,
                label: t(`metric.${option}`),
              }))}
              value={metric}
              onChange={setMetric}
              aria-label={t("filters.metric")}
            />
          </div>

          <div className={styles.filterField}>
            <span id="ranking-dashboard-topn-label">{t("filters.topN")}</span>
            <Select<TopNOption>
              className={styles.topNSelect}
              options={topNOptions.map((option) => ({
                value: option,
                label: t("filters.topNOption", { count: option }),
              }))}
              value={topN}
              onChange={setTopN}
              aria-label={t("filters.topN")}
            />
          </div>
        </div>
      </header>

      <div className={styles.chartsGrid}>
        <article className={styles.chartCard}>
          <h3>{t("topChart.title", { count: topN, metric: metricLabel })}</h3>
          <p>{t("topChart.description", { metric: metricLabel })}</p>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricData}
                layout="vertical"
                margin={{ top: 4, right: 28, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={isPercentage ? [0, 100] : [0, "auto"]}
                  tick={axisTick}
                  tickFormatter={formatMetric}
                  stroke="var(--border-strong)"
                />
                <YAxis
                  type="category"
                  dataKey="nickname"
                  width={110}
                  tick={axisTick}
                  tickFormatter={atNickname}
                  stroke="var(--border-strong)"
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-muted)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  labelFormatter={(label) => atNickname(String(label))}
                  formatter={(value) => [
                    formatMetric(Number(value)),
                    metricLabel,
                  ]}
                />
                <Bar
                  dataKey="value"
                  name={metricLabel}
                  fill="var(--brand-primary)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={styles.chartCard}>
          <h3>{t("resultsChart.title", { count: RESULTS_CHART_LIMIT })}</h3>
          <p>{t("resultsChart.description")}</p>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={resultsData}
                margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="nickname"
                  tick={axisTick}
                  tickFormatter={atNickname}
                  stroke="var(--border-strong)"
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  stroke="var(--border-strong)"
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-muted)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  labelFormatter={(label) => atNickname(String(label))}
                />
                <Legend
                  wrapperStyle={{
                    color: "var(--text-on-card)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                />
                <Bar
                  dataKey="victories"
                  name={t("resultsChart.victories")}
                  fill="var(--success)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
                <Bar
                  dataKey="defeats"
                  name={t("resultsChart.defeats")}
                  fill="var(--error)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  );
}
