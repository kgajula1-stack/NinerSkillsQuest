import { createServer } from "node:http";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const port = Number(process.env.API_PORT ?? 3001);
const DEMO_STUDENT_ID = "00000000-0000-0000-0000-000000000001";

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

export function createApiServer({
  prismaClient,
  studentId = DEMO_STUDENT_ID,
}) {
  async function getSelections() {
    const selections = await prismaClient.studentCourse.findMany({
      where: { studentId },
      include: { course: { include: { skillMappings: { include: { skill: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    return selections.map(({ course }) => ({
      ...course,
      skillIds: course.skillMappings.map(({ skillId }) => skillId),
    }));
  }

  async function getItinerary() {
    const activities = await prismaClient.itineraryActivity.findMany({
      where: { studentId },
      include: { recommendation: true },
      orderBy: [{ createdAt: "asc" }, { recommendationId: "asc" }],
    });
    return activities.map(({ recommendation }) => recommendation);
  }

  return createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      });
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname === "/api/itinerary" && request.method === "GET") {
        sendJson(response, 200, await getItinerary());
        return;
      }
      if (url.pathname === "/api/itinerary" && request.method === "POST") {
        const body = await readJson(request);
        const recommendationId = body?.recommendationId;
        if (typeof recommendationId !== "string" || !recommendationId) {
          sendJson(response, 400, { error: "Choose a recommendation to save." });
          return;
        }
        const recommendation = await prismaClient.recommendation.findUnique({
          where: { id: recommendationId },
        });
        if (!recommendation) {
          sendJson(response, 400, { error: "Recommendation unavailable. Refresh and choose another activity." });
          return;
        }
        // Idempotent saves also handle retries after a lost response.
        await prismaClient.itineraryActivity.upsert({
          where: { studentId_recommendationId: { studentId, recommendationId } },
          update: {},
          create: { studentId, recommendationId },
        });
        sendJson(response, 200, await getItinerary());
        return;
      }
      const itineraryMatch = url.pathname.match(/^\/api\/itinerary\/([^/]+)$/);
      if (itineraryMatch && request.method === "DELETE") {
        await prismaClient.itineraryActivity.deleteMany({
          where: { studentId, recommendationId: decodeURIComponent(itineraryMatch[1]) },
        });
        sendJson(response, 200, await getItinerary());
        return;
      }
      if (url.pathname === "/api/courses/completed" && request.method === "GET") {
        sendJson(response, 200, await getSelections());
        return;
      }

      if (url.pathname === "/api/courses/completed" && request.method === "POST") {
        const { courseId } = await readJson(request);
        if (typeof courseId !== "string" || !courseId) {
          sendJson(response, 400, { error: "courseId is required." });
          return;
        }
        const course = await prismaClient.course.findUnique({ where: { id: courseId } });
        if (!course) {
          sendJson(response, 400, { error: "That course does not exist." });
          return;
        }
        await prismaClient.studentCourse.create({
          data: { studentId, courseId, completedAt: new Date() },
        });
        sendJson(response, 201, await getSelections());
        return;
      }

      const match = url.pathname.match(/^\/api\/courses\/completed\/([^/]+)$/);
      if (match && request.method === "DELETE") {
        await prismaClient.studentCourse.delete({
          where: { studentId_courseId: { studentId, courseId: match[1] } },
        });
        sendJson(response, 200, await getSelections());
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof URIError) {
        sendJson(response, 400, { error: "Invalid request. Refresh and try again." });
        return;
      }
      if (error?.code === "P2002") {
        sendJson(response, 409, { error: "That course is already selected." });
        return;
      }
      if (error?.code === "P2025") {
        sendJson(response, 404, { error: "That course selection was not found." });
        return;
      }
      console.error("API request failed.", error);
      sendJson(response, 500, { error: "The database request failed." });
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const prisma = new PrismaClient();
  const server = createApiServer({ prismaClient: prisma });

  server.listen(port, () => {
    console.log(`Course API listening on http://localhost:${port}`);
  });

  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    server.close();
  });
}
