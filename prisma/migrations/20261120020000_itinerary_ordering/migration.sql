ALTER TABLE "itinerary_activities" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
WITH ranked AS (
  SELECT "studentId", "recommendationId",
    ROW_NUMBER() OVER (PARTITION BY "studentId" ORDER BY "createdAt", "recommendationId") - 1 AS position
  FROM "itinerary_activities"
)
UPDATE "itinerary_activities" AS activity SET "position" = ranked.position
FROM ranked WHERE activity."studentId" = ranked."studentId"
  AND activity."recommendationId" = ranked."recommendationId";
