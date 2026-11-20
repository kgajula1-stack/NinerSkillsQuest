import { recommendationCatalog } from "./recommendations";

export interface ItineraryRecommendation {
  id: string;
  title: string;
  type: "elective" | "project" | "practice-resource";
  skillId: string;
  url: string;
}

// Adapt the existing recommendations to stable IDs already used by the seed.
export const itineraryRecommendations: ItineraryRecommendation[] = recommendationCatalog.flatMap(
  (recommendation) => [
    ...recommendation.electives.map((course) => ({
      id: `elective:${recommendation.skillId}:${course.code}`,
      title: `${course.code}: ${course.title}`,
      type: "elective" as const,
      skillId: recommendation.skillId,
      url: course.url,
    })),
    ...recommendation.resources.map((resource) => ({
      id: `resource:${recommendation.skillId}:${resource.title}`,
      title: resource.title,
      type: "practice-resource" as const,
      skillId: recommendation.skillId,
      url: resource.url,
    })),
    {
      id: `project:${recommendation.skillId}:practice`,
      title: `Build a ${recommendation.skillName} practice project`,
      type: "project" as const,
      skillId: recommendation.skillId,
      url: recommendation.resources[0]?.url ?? "",
    },
  ],
);

export const activityTypeLabels = {
  elective: "Course",
  project: "Project",
  "practice-resource": "Practice resource",
};
