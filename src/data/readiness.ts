import { compareTargetSkills } from "./skillGap";
import type { SkillGapStatus } from "./skillGap";

export interface CareerReadiness {
  status: SkillGapStatus;
  percent: number | null;
  matchedCount: number;
  targetCount: number;
}

export function calculateReadiness(
  recordedSkillIds: readonly string[],
  targetSkillIds: readonly string[] | null,
): CareerReadiness {
  const comparison = compareTargetSkills(recordedSkillIds, targetSkillIds);
  const matchedCount = comparison.matchedSkillIds.length;
  const targetCount = matchedCount + comparison.unmatchedTargetSkillIds.length;
  return {
    status: comparison.status,
    percent: comparison.status === "ready" ? Math.round(matchedCount / targetCount * 100) : null,
    matchedCount,
    targetCount,
  };
}
