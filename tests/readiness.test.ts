import { describe, expect, it } from "vitest";
import { calculateReadiness } from "../src/data/readiness";

describe("explained career readiness", () => {
  it("shows 75 percent for three of four distinct target skills", () => {
    expect(calculateReadiness(["java", "api", "sql"], ["java", "api", "sql", "agile"])).toEqual({
      status: "ready", percent: 75, matchedCount: 3, targetCount: 4,
    });
  });

  it("deduplicates evidence and targets and excludes unrelated skills", () => {
    expect(calculateReadiness(["java", "java", "other"], ["java", "java", "api"])).toEqual({
      status: "ready", percent: 50, matchedCount: 1, targetCount: 2,
    });
  });

  it("covers zero and full coverage without exceeding 100", () => {
    expect(calculateReadiness([], ["java"]).percent).toBe(0);
    expect(calculateReadiness(["java", "java", "other"], ["java"]).percent).toBe(100);
  });

  it("rounds fractional scores to a whole percent", () => {
    expect(calculateReadiness(["java"], ["java", "api", "sql"]).percent).toBe(33);
    expect(calculateReadiness(["java", "api"], ["java", "api", "sql"]).percent).toBe(67);
  });

  it("recalculates when the inventory or career goal changes", () => {
    expect(calculateReadiness(["java"], ["java", "api"]).percent).toBe(50);
    expect(calculateReadiness(["java", "api"], ["java", "api"]).percent).toBe(100);
    expect(calculateReadiness(["java", "api"], ["sql"]).percent).toBe(0);
    expect(calculateReadiness([], ["java", "api"]).percent).toBe(0);
  });

  it("keeps missing goals and empty target sets unavailable", () => {
    expect(calculateReadiness(["java"], null)).toEqual({
      status: "missing-goal", percent: null, matchedCount: 0, targetCount: 0,
    });
    expect(calculateReadiness(["java"], [])).toEqual({
      status: "empty-target", percent: null, matchedCount: 0, targetCount: 0,
    });
  });
});
