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
        return rows.filter((row) => row.studentId === where.studentId).sort((a, b) => a.position - b.position)
          .map((row) => ({ ...row, recommendation: recommendations.find((item) => item.id === row.recommendationId) }));
      },
      aggregate: async ({ where }) => ({ _max: { position: rows.filter((row) => row.studentId === where.studentId).reduce((max, row) => Math.max(max, row.position), -1) } }),
      upsert: async ({ create }) => {
        if (!rows.some((row) => row.studentId === create.studentId && row.recommendationId === create.recommendationId)) rows.push({ ...create, completed: false });
      },
      updateMany: async ({ where, data }) => {
        if (fail) throw new Error("Simulated database failure");
        const selected = rows.filter((row) => row.studentId === where.studentId && row.recommendationId === where.recommendationId);
        selected.forEach((row) => Object.assign(row, data));
        return { count: selected.length };
      },
      deleteMany: async ({ where }) => {
        for (let index = rows.length - 1; index >= 0; index--) {
          if (rows[index].studentId === where.studentId && rows[index].recommendationId === where.recommendationId) rows.splice(index, 1);
        }
      },
    },
  };
  prismaClient.$transaction = async (work) => {
    const before = structuredClone(rows);
    try { return await work(prismaClient); }
    catch (error) { rows.splice(0, rows.length, ...before); throw error; }
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
  const complete = (id, completed) => fetch(`${base}/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }),
  });
  const reorder = (recommendationIds) => fetch(`${base}/order`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recommendationIds }),
  });
  try {
    await start();
    assert.deepEqual(await (await fetch(base)).json(), []);
    for (const item of recommendations) assert.equal((await save(item.id)).status, 200);
    assert.ok((await (await fetch(base)).json()).every((activity) => activity.completed === false));
    await Promise.all([save(recommendations[0].id), save(recommendations[0].id)]);
    assert.equal(rows.length, 3);
    assert.equal((await save("unknown")).status, 400);
    assert.equal((await save(null)).status, 400);
    assert.equal((await fetch(base, { method: "POST", body: "{" })).status, 400);
    for (const invalid of ["true", 1, null, undefined]) {
      assert.equal((await complete(recommendations[0].id, invalid)).status, 400);
    }
    assert.equal((await complete("unknown", true)).status, 404);
    for (const item of recommendations) {
      const completed = await complete(item.id, true);
      assert.equal(completed.status, 200);
      assert.equal((await completed.json()).find((activity) => activity.id === item.id).completed, true);
    }
    await complete(recommendations[0].id, true);
    await save(recommendations[0].id);
    assert.equal(rows.length, 3);
    assert.ok(rows.every((row) => row.completed));
    const orderedIds = recommendations.map((activity) => activity.id).reverse();
    assert.equal((await reorder([orderedIds[0], orderedIds[0]])).status, 400);
    assert.equal((await reorder(orderedIds.slice(1))).status, 409);
    assert.equal((await reorder([...orderedIds.slice(1), "unknown"])).status, 409);
    assert.equal((await reorder(orderedIds)).status, 200);
    assert.deepEqual((await (await fetch(base)).json()).map((activity) => activity.id), orderedIds);
    await stop();
    await start();
    assert.deepEqual(await (await fetch(base)).json(), [...recommendations].reverse().map((activity) => ({ ...activity, completed: true })));
    await stop();
    await start("student-b");
    assert.deepEqual(await (await fetch(base)).json(), []);
    assert.equal((await complete(recommendations[0].id, false)).status, 404);
    assert.equal((await reorder(orderedIds)).status, 409);
    assert.equal((await reorder([])).status, 200);
    assert.ok(rows.every((row) => row.completed));
    await fetch(`${base}/${encodeURIComponent(recommendations[0].id)}`, { method: "DELETE" });
    assert.equal(rows.length, 3);
    await stop();
    await start();
    fail = true;
    assert.equal((await reorder([...orderedIds].reverse())).status, 500);
    fail = false;
    assert.deepEqual((await (await fetch(base)).json()).map((activity) => activity.id), orderedIds);
    fail = true;
    assert.equal((await complete(recommendations[0].id, false)).status, 500);
    assert.ok(rows.every((row) => row.completed));
    fail = false;
    assert.equal((await complete(recommendations[0].id, false)).status, 200);
    assert.equal(rows[0].completed, false);
    assert.deepEqual(Object.keys(rows[0]).sort(), ["completed", "position", "recommendationId", "studentId"]);
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
