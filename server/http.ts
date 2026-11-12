import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { PrismaClient } from "@prisma/client";
import { InvalidCoursesError, readCourses, saveCourses } from "./course-workflow";

function respond(response: ServerResponse, status: number, body: object): void {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function handleRequest(request: IncomingMessage, response: ServerResponse, db: PrismaClient): Promise<void> {
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(request.headers.host ?? "")) {
    respond(response, 403, { error: "Host not allowed." });
    return;
  }
  if (request.url !== "/api/demo/courses") {
    respond(response, 404, { error: "Not found." });
    return;
  }
  if (request.method === "GET") {
    respond(response, 200, { courseIds: await readCourses(db) });
    return;
  }
  if (request.method !== "PUT") {
    respond(response, 405, { error: "Method not allowed." });
    return;
  }
  const origin = request.headers.origin;
  if (origin && origin !== "http://localhost:5173" && origin !== "http://127.0.0.1:5173") {
    respond(response, 403, { error: "Origin not allowed." });
    return;
  }
  if (request.headers["content-type"] !== "application/json") {
    respond(response, 415, { error: "Expected application/json." });
    return;
  }
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
    if (body.length > 16384) {
      respond(response, 413, { error: "Request is too large." });
      return;
    }
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    respond(response, 400, { error: "Invalid JSON." });
    return;
  }
  if (
    typeof parsed !== "object" || parsed === null || !("courseIds" in parsed) ||
    !Array.isArray(parsed.courseIds) ||
    !parsed.courseIds.every((id: unknown) => typeof id === "string" && id.length > 0) ||
    new Set(parsed.courseIds).size !== parsed.courseIds.length
  ) {
    respond(response, 400, { error: "courseIds must be an array of unique course IDs." });
    return;
  }
  await saveCourses(db, parsed.courseIds);
  respond(response, 200, { courseIds: await readCourses(db) });
}

export function createApiServer(db: PrismaClient) {
  return createServer((request, response) => {
    handleRequest(request, response, db).catch((error: unknown) => {
      if (error instanceof InvalidCoursesError) {
        respond(response, 400, { error: error.message });
      } else {
        console.error("Database request failed:", error);
        respond(response, 500, { error: "Database request failed. Check the server logs and database setup." });
      }
    });
  });
}
