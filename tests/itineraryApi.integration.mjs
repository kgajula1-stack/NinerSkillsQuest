import assert from "node:assert/strict";
import { test } from "node:test";
import { createApiServer } from "../server/api.mjs";

// Shared database adapter lets the HTTP contract run without PostgreSQL.
test("itinerary HTTP contract: types, retries, restart, removal and student scope", async () => {
  const recommendations = ["elective", "project", "practice-resource"].map((type) => ({
    id: `${type}:java:example`, type, skillId: "java", title: `${type} example`, url: "https://example.org/",
  }));
  const rows = [];
  let fail = false;
  const prismaClient = {
    recommendation: { findUnique: async ({ where }) => recommendations.find((item) => item.id === where.id) },
    itineraryActivity: {
      findMany: async ({ where }) => {
        if (fail) throw new Error("Simulated database failure");
        return rows.filter((row) => row.studentId === where.studentId)
          .map((row) => ({ recommendation: recommendations.find((item) => item.id === row.recommendationId) }));
      },
      upsert: async ({ create }) => {
        if (!rows.some((row) => row.studentId === create.studentId && row.recommendationId === create.recommendationId)) rows.push(create);
      },
      deleteMany: async ({ where }) => {
        for (let index = rows.length - 1; index >= 0; index--) {
          if (rows[index].studentId === where.studentId && rows[index].recommendationId === where.recommendationId) rows.splice(index, 1);
        }
      },
    },
  };
  let server;
  let base;
  async function start(studentId = "student-a") {
    server = createApiServer({ prismaClient, studentId });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}/api/itinerary`;
  }
  async function stop() {
    await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
  }
  const save = (id) => fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recommendationId: id }) });
  try {
    await start();
    assert.deepEqual(await (await fetch(base)).json(), []);
    for (const item of recommendations) assert.equal((await save(item.id)).status, 200);
    await Promise.all([save(recommendations[0].id), save(recommendations[0].id)]);
    assert.equal(rows.length, 3);
    assert.equal((await save("unknown")).status, 400);
    assert.equal((await save(null)).status, 400);
    assert.equal((await fetch(base, { method: "POST", body: "{" })).status, 400);
    await stop();
    await start();
    assert.deepEqual(await (await fetch(base)).json(), recommendations);
    await stop();
    await start("student-b");
    assert.deepEqual(await (await fetch(base)).json(), []);
    await fetch(`${base}/${encodeURIComponent(recommendations[0].id)}`, { method: "DELETE" });
    assert.equal(rows.length, 3);
    await stop();
    await start();
    for (const item of recommendations) {
      assert.equal((await fetch(`${base}/${encodeURIComponent(item.id)}`, { method: "DELETE" })).status, 200);
    }
    assert.deepEqual(await (await fetch(base)).json(), []);
    fail = true;
    assert.equal((await fetch(base)).status, 500);
    fail = false;
    assert.equal((await fetch(base)).status, 200);
  } finally {
    await stop();
  }
});
