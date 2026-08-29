// Analytics engine (FINAL_PLAN §15). Pure functions over stored rows.
import type { Application, ApplicationWithJob, Job, TokenUsage } from "../store/types";

export interface StatusCounts {
  [status: string]: number;
}

export function statusCounts(apps: Application[]): StatusCounts {
  const counts: StatusCounts = {};
  for (const a of apps) counts[a.status] = (counts[a.status] || 0) + 1;
  return counts;
}

export function groupBy<T>(rows: T[], keyFn: (r: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = keyFn(r) || "Unknown";
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export function dailyTrend(apps: Application[], days = 14): TimeseriesPoint[] {
  const byDay: Record<string, number> = {};
  for (const a of apps) {
    const d = (a.submittedAt || a.createdAt).slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  }
  const points: TimeseriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    points.push({ date, count: byDay[date] || 0 });
  }
  return points;
}

export function averageScore(jobs: Job[]): number {
  if (!jobs.length) return 0;
  const sc = jobs.filter((j) => j.matchScore > 0);
  if (!sc.length) return 0;
  return Math.round(sc.reduce((s, j) => s + j.matchScore, 0) / sc.length);
}

export interface TokenTotals {
  input: number;
  output: number;
  total: number;
  cost: number;
}

export function tokenTotals(usage: TokenUsage[]): TokenTotals {
  return usage.reduce(
    (acc, u) => ({
      input: acc.input + u.inputTokens,
      output: acc.output + u.outputTokens,
      total: acc.total + u.inputTokens + u.outputTokens,
      cost: acc.cost + u.estimatedCost,
    }),
    { input: 0, output: 0, total: 0, cost: 0 },
  );
}

export function countBy(rows: any[], fn: (r: any) => string): [string, number][] {
  const g = groupBy(rows, fn);
  return Object.entries(g).sort((a, b) => b[1] - a[1]);
}
