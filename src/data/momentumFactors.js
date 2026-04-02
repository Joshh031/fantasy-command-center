// ============================================================
// BARRA MOMENTUM FACTOR MODEL — Fantasy Baseball Adaptation
// ============================================================
// Based on the well-documented MSCI Barra factor framework.
// Translates equity risk factors into fantasy baseball metrics.
//
// Barra Factor → Fantasy Analog:
//   MOMENTUM   → Projection alpha vs. CBS consensus rank
//   VOLATILITY → Stat-line dispersion (boom/bust profile)
//   SIZE       → Playing time / opportunity (AB, IP)
//   VALUE      → Points efficiency per ranking slot
//   QUALITY    → Underlying skill ratios (BB/K, WHIP, ISO)
//   GROWTH     → Age-curve trajectory (youth premium)
// ============================================================

import battersData from "./batters.json";
import pitchersData from "./pitchers.json";

// ── Z-score normalization ──
function zScore(values) {
  const n = values.length;
  if (n === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n) || 1;
  return values.map((v) => (v - mean) / std);
}

// ── Winsorize to [-3, 3] to limit outlier influence ──
function winsorize(z, limit = 3) {
  return Math.max(-limit, Math.min(limit, z));
}

// ── Factor weights (Barra convention: momentum-tilted) ──
const BATTER_WEIGHTS = {
  momentum: 0.30,
  volatility: -0.10, // negative = prefer low vol
  size: 0.15,
  value: 0.20,
  quality: 0.15,
  growth: 0.10,
};

const PITCHER_WEIGHTS = {
  momentum: 0.30,
  volatility: -0.10,
  size: 0.15,
  value: 0.20,
  quality: 0.15,
  growth: 0.10,
};

// ── Raw factor extraction: Batters ──
function extractBatterRaw(p) {
  const s = p.stats || {};
  const ab = s.AB || 1;
  const h = s.H || 0;
  const bb = s.BB || 0;
  const k = s.K || 1;
  const hr = s.HR || 0;
  const sb = s.SB || 0;
  const doubles = s["2B"] || 0;
  const triples = s["3B"] || 0;
  const obp = s.OBP || 0;
  const slg = s.SLG || 0;
  const avg = s.AVG || 0;

  // ISO (Isolated Power) = SLG - AVG
  const iso = slg - avg;

  // MOMENTUM: projection alpha = leagueFpts relative to cbsRank position
  // Higher fpts at worse rank = positive momentum (underpriced)
  const rankPenalty = (p.cbsRank || 200) / 10;
  const momentum = (p.leagueFpts || 0) - rankPenalty * 2;

  // VOLATILITY: stat dispersion across categories (high HR + high K = volatile)
  // Normalize: K/AB is bad variance, HR/AB + SB are high-beta
  const kRate = k / ab;
  const hrRate = hr / ab;
  const volatility = kRate * 100 + hrRate * 50 + (sb > 20 ? 10 : 0);

  // SIZE: playing time opportunity (AB is the primary proxy)
  const size = ab;

  // VALUE: points per ranking slot (efficiency)
  const value = (p.leagueFpts || 0) / Math.max(p.cbsRank || 1, 1);

  // QUALITY: plate discipline + contact quality
  // BB/K ratio, OBP, ISO are Barra "earnings quality" analogs
  const bbk = bb / k;
  const quality = bbk * 40 + obp * 100 + iso * 80;

  // GROWTH: age curve premium (younger = more upside)
  // Peak age for hitters ~27-28. Youth premium decays after 30.
  const growth = Math.max(0, 35 - (p.age || 28)) * 2;

  return { momentum, volatility, size, value, quality, growth };
}

// ── Raw factor extraction: Pitchers ──
function extractPitcherRaw(p) {
  const s = p.stats || {};
  const inn = s.INNs || 1;
  const k = s.K || 0;
  const bb = s.BB || 1;
  const w = s.W || 0;
  const qs = s.QS || 0;
  const era = s.ERA || 5;
  const whip = s.WHIP || 1.5;
  const h = s.H || 0;

  // MOMENTUM: same framework as batters
  const rankPenalty = (p.cbsRank || 200) / 10;
  const momentum = (p.leagueFpts || 0) - rankPenalty * 2;

  // VOLATILITY: ERA variance proxy + walk rate
  // High WHIP + high BB/9 = volatile pitcher
  const bb9 = (bb / inn) * 9;
  const volatility = whip * 30 + bb9 * 10 + (era > 4 ? 15 : 0);

  // SIZE: innings workload
  const size = inn;

  // VALUE: points per ranking slot
  const value = (p.leagueFpts || 0) / Math.max(p.cbsRank || 1, 1);

  // QUALITY: K/BB ratio, low WHIP, QS rate
  const kbb = k / bb;
  const qsRate = qs / Math.max(s.GS || 1, 1);
  const quality = kbb * 15 + (1.5 - whip) * 60 + qsRate * 40;

  // GROWTH: age curve (SP peak ~26-28, youth premium)
  const growth = Math.max(0, 34 - (p.age || 27)) * 2;

  return { momentum, volatility, size, value, quality, growth };
}

// ── Compute composite scores for a player pool ──
function computeFactorScores(players, extractFn, weights) {
  if (players.length === 0) return [];

  // Step 1: Extract raw factors
  const raws = players.map(extractFn);

  // Step 2: Z-score normalize each factor across the universe
  const factors = ["momentum", "volatility", "size", "value", "quality", "growth"];
  const zScores = {};
  for (const f of factors) {
    const vals = raws.map((r) => r[f]);
    const zs = zScore(vals);
    zScores[f] = zs.map(winsorize);
  }

  // Step 3: Compute weighted composite
  return players.map((p, i) => {
    const factorValues = {};
    let composite = 0;
    for (const f of factors) {
      factorValues[f] = zScores[f][i];
      composite += zScores[f][i] * weights[f];
    }

    // Normalize composite to 0-100 scale for display
    return {
      ...p,
      factors: factorValues,
      compositeRaw: composite,
    };
  });
}

// ── Rescale composites to 0–100 after scoring ──
function rescaleComposites(scored) {
  if (scored.length === 0) return [];
  const raws = scored.map((s) => s.compositeRaw);
  const min = Math.min(...raws);
  const max = Math.max(...raws);
  const range = max - min || 1;
  return scored.map((s) => ({
    ...s,
    composite: Math.round(((s.compositeRaw - min) / range) * 100),
  }));
}

// ── Signal classification ──
function classifySignal(composite) {
  if (composite >= 80) return { label: "STRONG BUY", color: "#00ff88" };
  if (composite >= 65) return { label: "BUY", color: "#88cc44" };
  if (composite >= 45) return { label: "HOLD", color: "#ffaa00" };
  if (composite >= 25) return { label: "SELL", color: "#ff6b35" };
  return { label: "STRONG SELL", color: "#ff4a4a" };
}

// ── Factor interpretation helpers ──
function getFactorLabel(factor) {
  const labels = {
    momentum: "Momentum",
    volatility: "Volatility",
    size: "Size",
    value: "Value",
    quality: "Quality",
    growth: "Growth",
  };
  return labels[factor] || factor;
}

function getFactorDescription(factor) {
  const desc = {
    momentum: "Projection alpha vs. consensus rank — are they outperforming expectations?",
    volatility: "Stat-line dispersion risk — high K-rate, boom/bust profile (lower is better)",
    size: "Playing time opportunity — AB for hitters, IP for pitchers",
    value: "Points efficiency per ranking slot — undervalued gems score high",
    quality: "Underlying skill metrics — plate discipline, K/BB, ISO, WHIP",
    growth: "Age-curve trajectory — youth premium for players still approaching peak",
  };
  return desc[factor] || "";
}

// ── Main export: compute full model ──
export function computeMomentumModel() {
  // Filter to players with sufficient data
  const batters = battersData.filter(
    (p) => p.stats && p.stats.AB > 100 && p.leagueFpts
  );
  const pitchers = pitchersData.filter(
    (p) => p.stats && p.stats.INNs > 40 && p.leagueFpts
  );

  const scoredBatters = rescaleComposites(
    computeFactorScores(batters, extractBatterRaw, BATTER_WEIGHTS)
  );
  const scoredPitchers = rescaleComposites(
    computeFactorScores(pitchers, extractPitcherRaw, PITCHER_WEIGHTS)
  );

  // Sort by composite descending
  scoredBatters.sort((a, b) => b.composite - a.composite);
  scoredPitchers.sort((a, b) => b.composite - a.composite);

  return { batters: scoredBatters, pitchers: scoredPitchers };
}

export { classifySignal, getFactorLabel, getFactorDescription };

// ── Factor weight configs (exported for UI display) ──
export const FACTOR_WEIGHTS = { batter: BATTER_WEIGHTS, pitcher: PITCHER_WEIGHTS };
