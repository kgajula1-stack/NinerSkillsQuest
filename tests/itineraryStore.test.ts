import { describe, expect, it, vi } from "vitest";
import { ItineraryStore } from "../src/state/itineraryStore";
import { itineraryRecommendations } from "../src/data/itineraryRecommendations";

const activity = itineraryRecommendations[0];
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("saved itinerary", () => {
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
