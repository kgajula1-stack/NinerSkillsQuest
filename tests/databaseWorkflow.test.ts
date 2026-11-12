import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import { courses, skills } from "../src/data/catalog";
import { seedDatabase } from "../prisma/seed-data";
import { createDatabase, DEMO_STUDENT_ID } from "../server/database";
import { createApiServer } from "../server/http";

describe("SQLite completed-course workflow", () => {
  let directory: string;
  let db: PrismaClient;
  let server: Server;
  let baseUrl: string;
  let url: string;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "niner-skills-test-"));
    url = `file:${join(directory, "test.db")}`;
    execFileSync(process.execPath, [resolve("node_modules", "prisma", "build", "index.js"), "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });
    db = createDatabase(url);
    await seedDatabase(db);
    server = createApiServer(db);
    await new Promise<void>((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolveListen);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test server address.");
    baseUrl = `http://127.0.0.1:${address.port}/api/demo/courses`;
  }, 30000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
    if (db) await db.$disconnect();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  async function save(courseIds: string[]) {
    return fetch(baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseIds }),
    });
  }

  it("seeds the sample student, catalog, and mappings idempotently without resetting selections", async () => {
    expect(await db.skill.count()).toBe(skills.length);
    expect(await db.course.count()).toBe(courses.length);
    expect(await db.courseSkill.count()).toBe(courses.reduce((count, course) => count + course.skillIds.length, 0));
    expect((await save(["itcs-2214"])).status).toBe(200);
    await seedDatabase(db);
    expect(await db.courseSkill.count()).toBe(courses.reduce((count, course) => count + course.skillIds.length, 0));
    expect(await (await fetch(baseUrl)).json()).toEqual({ courseIds: ["itcs-2214"] });
  });

  it("persists additions across database connections, then removes courses including the last one", async () => {
    expect((await save(["itcs-2214", "itis-3200"])).status).toBe(200);
    const secondDb = createDatabase(url);
    try {
      const records = await secondDb.studentCourse.findMany({
        where: { studentId: DEMO_STUDENT_ID },
        include: { course: { include: { skillMappings: true } } },
      });
      expect(records).toHaveLength(2);
      expect(records.find((record) => record.courseId === "itcs-2214")?.course.skillMappings).toHaveLength(2);
    } finally {
      await secondDb.$disconnect();
    }
    expect((await save(["itis-3200"])).status).toBe(200);
    expect(await (await fetch(baseUrl)).json()).toEqual({ courseIds: ["itis-3200"] });
    expect((await save([])).status).toBe(200);
    expect(await (await fetch(baseUrl)).json()).toEqual({ courseIds: [] });
  });

  it("rejects invalid and duplicate IDs without changing saved courses", async () => {
    await save(["itcs-2214"]);
    expect((await save(["unknown"])).status).toBe(400);
    expect((await save(["itcs-2214", "itcs-2214"])).status).toBe(400);
    expect(await (await fetch(baseUrl)).json()).toEqual({ courseIds: ["itcs-2214"] });
  });

  it("does not overwrite or delete records belonging to another course workflow", async () => {
    await db.studentCourse.create({
      data: { studentId: DEMO_STUDENT_ID, courseId: "itis-3200", status: "IN_PROGRESS" },
    });
    expect((await save(["itis-3200"])).status).toBe(400);
    expect((await save([])).status).toBe(200);
    expect(await db.studentCourse.count({ where: { studentId: DEMO_STUDENT_ID, status: "IN_PROGRESS" } })).toBe(1);
  });

  it("keeps confirmed transcript courses separate from manual selections", async () => {
    await db.studentCourse.create({
      data: { studentId: DEMO_STUDENT_ID, courseId: "itcs-2214", source: "TRANSCRIPT" },
    });
    expect(await (await fetch(baseUrl)).json()).toEqual({ courseIds: [] });
    expect((await save(["itcs-2214"])).status).toBe(400);
    expect((await save([])).status).toBe(200);
    expect(await db.studentCourse.findUnique({
      where: { studentId_courseId: { studentId: DEMO_STUDENT_ID, courseId: "itcs-2214" } },
    })).toMatchObject({ source: "TRANSCRIPT" });
  });

  it("rejects unsafe origins and malformed payloads", async () => {
    const crossOrigin = await fetch(baseUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "https://example.com" },
      body: JSON.stringify({ courseIds: [] }),
    });
    expect(crossOrigin.status).toBe(403);
    const invalidJson = await fetch(baseUrl, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: "{",
    });
    expect(invalidJson.status).toBe(400);
  });
});
