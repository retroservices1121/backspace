// Inline accuracy chip rendered next to an author's name in the feed.
// Surfaces the "this person actually calls them right" signal without
// requiring a profile click. The presence of the chip is the signal;
// the percentage is the detail.
//
// Visibility rules mirror ProfileHeader.AccuracyBadge:
//   - `publicAccuracy` opt-in is required (server-side default off)
//   - At least one resolved position (no zero-base bragging)
// Authors who don't trade, opted out, or have no resolved positions
// render nothing — silent, not "private". Keeps the timeline clean.

import React from 'react';

type AccuracyLike = {
  resolvedPositions?: number;
  correctPositions?: number;
  rankingScore?: number;
};

type Props = {
  publicAccuracy?: boolean;
  accuracy?: AccuracyLike | null;
};

const CalibrationChip: React.FC<Props> = ({ publicAccuracy, accuracy }) => {
  if (!publicAccuracy) return null;
  if (!accuracy) return null;
  const resolved = accuracy.resolvedPositions ?? 0;
  const correct = accuracy.correctPositions ?? 0;
  if (resolved <= 0) return null;

  const pct = Math.round((correct / resolved) * 100);
  // Color-code by accuracy band. 60%+ is the "calibrated trader" tier;
  // 50–59% is neutral; below 50% we still show the badge but in a dim
  // tone so opt-in users aren't punished for transparency.
  let tone: string;
  if (pct >= 60) {
    tone = 'text-emerald-300 border-emerald-300/40 bg-emerald-300/10';
  } else if (pct >= 50) {
    tone = 'text-fontTertiary border-white/15 bg-white/5';
  } else {
    tone = 'text-fontTertiary border-white/10 bg-white/[0.03]';
  }
  const chipClass = 'inline-flex items-center gap-1 rounded-full border'
    + ' px-1.5 py-0.5 text-[10px] font-semibold tabular-nums';

  return (
    <span
      title={`${correct}/${resolved} resolved positions correct`}
      className={`${chipClass} ${tone}`}
    >
      {pct}%
    </span>
  );
};

export default CalibrationChip;
