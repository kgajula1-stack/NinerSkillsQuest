export async function requestDatabaseCourses(courseIds?: string[]): Promise<string[]> {
  const response = await fetch("/api/demo/courses", courseIds === undefined ? undefined : {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseIds }),
  });
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The database server returned an unexpected response.");
  }
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result &&
      typeof result.error === "string" ? result.error : "Database request failed.";
    throw new Error(message);
  }
  if (
    typeof result !== "object" || result === null || !("courseIds" in result) ||
    !Array.isArray(result.courseIds) ||
    !result.courseIds.every((id: unknown) => typeof id === "string")
  ) {
    throw new Error("The database returned an invalid course list.");
  }
  return result.courseIds;
}
