// ══════════════════════════════════════════════════════════════════════════
// CARD STAGE MODEL — single TypeScript source of truth for stage data
// ══════════════════════════════════════════════════════════════════════════
//
// To change a stage label, color, or timeline → edit STAGE_CONFIG below.
// All other exports (STAGE_COLORS, STAGE_LABELS, STAGE_DAYS, STAGE_ORDER)
// are derived from STAGE_CONFIG and kept for backward compatibility.
//
// ══════════════════════════════════════════════════════════════════════════

export enum CardStage {
  Storm    = 'storm',
  Fog      = 'fog',
  Clearing = 'clearing',
  Aura     = 'aura',
  Radiance = 'radiance',
  Legend   = 'legend',
}

// ── Master configuration — edit here to change anything per stage ─────────
// Stages are listed in progression order (index 0 = earliest).
export const STAGE_CONFIG: Record<CardStage, {
  color: string;  // primary hex color (used in TypeScript — CSS uses --stage-* vars)
  label: string;  // display name shown in UI
  days:  string;  // timeline label, e.g. "Day 1–30"
}> = {
  [CardStage.Storm]:    { color: '#6366f1', label: 'The Storm',    days: 'Day 1–30' },
  [CardStage.Fog]:      { color: '#818cf8', label: 'The Fog',      days: 'Day 31–90' },
  [CardStage.Clearing]: { color: '#5ecfff', label: 'The Clearing', days: 'Day 91–180' },
  [CardStage.Aura]:     { color: '#a855f7', label: 'The Aura',     days: 'Day 181–270' },
  [CardStage.Radiance]: { color: '#ffb347', label: 'The Radiance', days: 'Day 271–364' },
  [CardStage.Legend]:   { color: '#f472b6', label: 'The Legend',   days: 'Day 365' },
};

// ── Derived constants — DO NOT edit; change STAGE_CONFIG above instead ────

/** Stages in progression order, earliest first. */
export const STAGE_ORDER: CardStage[] = Object.values(CardStage);

/** Hex color for each stage. */
export const STAGE_COLORS: Record<CardStage, string> = Object.fromEntries(
  Object.entries(STAGE_CONFIG).map(([k, v]) => [k, v.color])
) as Record<CardStage, string>;

/** Display label for each stage. */
export const STAGE_LABELS: Record<CardStage, string> = Object.fromEntries(
  Object.entries(STAGE_CONFIG).map(([k, v]) => [k, v.label])
) as Record<CardStage, string>;

/** Timeline label for each stage. */
export const STAGE_DAYS: Record<CardStage, string> = Object.fromEntries(
  Object.entries(STAGE_CONFIG).map(([k, v]) => [k, v.days])
) as Record<CardStage, string>;

// ── Utility functions ─────────────────────────────────────────────────────

/** Returns the next stage after the given one, or null if already at Legend. */
export function nextStage(stage: CardStage): CardStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

/** Returns the 0-based index of a stage in the progression order. */
export function stageIndex(stage: CardStage): number {
  return STAGE_ORDER.indexOf(stage);
}
