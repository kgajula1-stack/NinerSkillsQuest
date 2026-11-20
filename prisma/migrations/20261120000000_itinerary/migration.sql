CREATE TABLE "itinerary_activities" (
    "studentId" UUID NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itinerary_activities_pkey" PRIMARY KEY ("studentId", "recommendationId")
);
CREATE INDEX "itinerary_activities_recommendationId_idx" ON "itinerary_activities"("recommendationId");
ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "recommendations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
