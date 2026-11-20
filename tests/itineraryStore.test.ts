import { describe, expect, it, vi } from "vitest";
import { ItineraryStore } from "../src/state/itineraryStore";
import { itineraryRecommendations } from "../src/data/itineraryRecommendations";

const activity = { ...itineraryRecommendations[0], completed: false };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("saved itinerary", () => {
  it("moves immediately, saves and reloads order, and rolls back a failed move", async () => {
    const second = { ...itineraryRecommendations[1], completed: true };
    let finish!: (value: Response) => void;
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([activity, second]))
      .mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce(reply([second, activity]))
      .mockResolvedValueOnce(reply({}, 500));
    const store = new ItineraryStore(request);
    await store.load();
    const moving = store.move(second.id, -1);
    expect(store.getState().activities.map((item) => item.id)).toEqual([second.id, activity.id]);
    expect(store.getState().completedCount).toBe(1);
    expect(store.getState().busy).toBe(true);
    finish(reply([second, activity]));
    await moving;
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toEqual({ recommendationIds: [second.id, activity.id] });
    const reopened = new ItineraryStore(request);
    await reopened.load();
    expect(reopened.getState().activities.map((item) => item.id)).toEqual([second.id, activity.id]);
    await reopened.move(second.id, 1);
    expect(reopened.getState().activities.map((item) => item.id)).toEqual([second.id, activity.id]);
    expect(reopened.getState().failed).toBe(true);
  });

  it("ignores moves for empty, single-item, unknown and boundary positions", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(reply([])).mockResolvedValueOnce(reply([activity]));
    const store = new ItineraryStore(request);
    await store.move(activity.id, 1);
    await store.load();
    await store.move(activity.id, 1);
    await store.load();
    await store.move(activity.id, -1);
    await store.move(activity.id, 1);
    await store.move("unknown", 1);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("persists completion and undo, counts progress, and reopens the saved state", async () => {
    const second = { ...itineraryRecommendations[1], completed: false };
    const done = { ...activity, completed: true };
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([activity, second]))
      .mockResolvedValueOnce(reply([done, second]))
      .mockResolvedValueOnce(reply([done, second]))
      .mockResolvedValueOnce(reply([activity, second]))
      .mockResolvedValueOnce(reply([second]));
    const store = new ItineraryStore(request);
    await store.load();
    expect(store.getState().completedCount).toBe(0);
    await store.setCompleted(activity.id, true);
    expect(store.getState().completedCount).toBe(1);
    expect(store.getState().message).toContain("Progress saved");
    expect(request.mock.calls[1]).toEqual([
      `/api/itinerary/${encodeURIComponent(activity.id)}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: true }) },
    ]);
    const reopened = new ItineraryStore(request);
    await reopened.load();
    expect(reopened.getState().completedCount).toBe(1);
    expect(reopened.getState().activities[0].completed).toBe(true);
    await reopened.setCompleted(activity.id, false);
    expect(reopened.getState().completedCount).toBe(0);
    expect(reopened.getState().message).toContain("incomplete");
    await reopened.remove(activity.id);
    expect(reopened.getState().activities).toHaveLength(1);
  });

  it("retains completion and counts after a failed update, then permits retry", async () => {
    const done = { ...activity, completed: true };
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([activity]))
      .mockResolvedValueOnce(reply({}, 500))
      .mockResolvedValueOnce(reply([done]))
      .mockResolvedValueOnce(reply([]));
    const store = new ItineraryStore(request);
    await store.load();
    await store.setCompleted(activity.id, true);
    expect(store.getState().activities[0].completed).toBe(false);
    expect(store.getState().completedCount).toBe(0);
    expect(store.getState().failed).toBe(true);
    expect(store.getState().message).toContain("retry");
    await store.setCompleted(activity.id, true);
    expect(store.getState().completedCount).toBe(1);
    await store.remove(activity.id);
    expect(store.getState().completedCount).toBe(0);
    expect(store.getState().activities).toHaveLength(0);
  });

  it("does not update unsaved activities or accept invalid completion data", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([{ ...activity, completed: "true" }]))
      .mockResolvedValueOnce(reply([]));
    const store = new ItineraryStore(request);
    await store.setCompleted(activity.id, true);
    expect(request).not.toHaveBeenCalled();
    await store.load();
    expect(store.getState().loaded).toBe(false);
    await store.load();
    await store.setCompleted(activity.id, true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(store.getState().completedCount).toBe(0);
  });

  it("adapts all activity types with unique stable IDs and skill metadata", () => {
    expect(new Set(itineraryRecommendations.map((item) => item.type)).size).toBe(3);
    expect(new Set(itineraryRecommendations.map((item) => item.id)).size).toBe(itineraryRecommendations.length);
    expect(itineraryRecommendations.every((item) => item.title && item.skillId && item.url)).toBe(true);
  });

  it("loads, saves once, reopens in a new store, and removes", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([]))
      .mockResolvedValueOnce(reply([activity]))
      .mockResolvedValueOnce(reply([activity]))
      .mockResolvedValueOnce(reply([]));
    const store = new ItineraryStore(request);
    await store.load();
    await store.add(activity.id);
    await store.add(activity.id);
    expect(request).toHaveBeenCalledTimes(2);
    expect(store.getState().message).toContain("saved");
    const reopened = new ItineraryStore(request);
    await reopened.load();
    expect(reopened.getState().activities).toEqual([activity]);
    await reopened.remove(activity.id);
    expect(reopened.getState().activities).toEqual([]);
    expect(request.mock.calls[3][0]).toContain(encodeURIComponent(activity.id));
  });

  it("preserves confirmed state on failed save/removal and allows retry", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply([]))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(reply([activity]))
      .mockResolvedValueOnce(reply({}, 500))
      .mockResolvedValueOnce(reply([]));
    const store = new ItineraryStore(request);
    await store.load();
    await store.add(activity.id);
    expect(store.getState().activities).toEqual([]);
    expect(store.getState().failed).toBe(true);
    expect(store.getState().message).toContain("retry");
    await store.add(activity.id);
    await store.remove(activity.id);
    expect(store.getState().activities).toEqual([activity]);
    await store.remove(activity.id);
    expect(store.getState().failed).toBe(false);
  });

  it("requires a successful load and handles unavailable or invalid responses", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(reply({}, 503))
      .mockResolvedValueOnce(reply([{ ...activity, url: "javascript:alert(1)" }]))
      .mockResolvedValueOnce(reply([]));
    const store = new ItineraryStore(request);
    await store.load();
    await store.add(activity.id);
    expect(request).toHaveBeenCalledTimes(1);
    expect(store.getState().message).toContain("Reload itinerary");
    await store.load();
    expect(store.getState().loaded).toBe(false);
    await store.load();
    expect(store.getState().loaded).toBe(true);
  });

  it("serializes pending operations and exposes loading state", async () => {
    let finish!: (value: Response) => void;
    const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const store = new ItineraryStore(request);
    const load = store.load();
    expect(store.getState().busy).toBe(true);
    await store.load();
    expect(request).toHaveBeenCalledTimes(1);
    finish(reply([]));
    await load;
    expect(store.getState().busy).toBe(false);
  });
});
