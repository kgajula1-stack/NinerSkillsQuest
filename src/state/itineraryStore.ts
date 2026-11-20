import type { ItineraryRecommendation } from "../data/itineraryRecommendations";

export interface ItineraryState {
  activities: ItineraryRecommendation[];
  busy: boolean;
  loaded: boolean;
  message: string | null;
  failed: boolean;
}

export class ItineraryStore {
  private state: ItineraryState = {
    activities: [], busy: false, loaded: false, message: null, failed: false,
  };
  private listeners = new Set<() => void>();

  constructor(private readonly request: typeof fetch = fetch) {}

  getState(): ItineraryState {
    return { ...this.state, activities: this.state.activities.map((activity) => ({ ...activity })) };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  load(): Promise<void> {
    return this.run("/api/itinerary", undefined, null);
  }

  add(id: string): Promise<void> {
    if (!this.state.loaded || this.state.activities.some((activity) => activity.id === id)) {
      return Promise.resolve();
    }
    return this.run("/api/itinerary", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendationId: id }),
    }, "Activity saved to your itinerary.");
  }

  remove(id: string): Promise<void> {
    return this.run(`/api/itinerary/${encodeURIComponent(id)}`, { method: "DELETE" },
      "Activity removed from your itinerary.");
  }

  private async run(url: string, options: RequestInit | undefined, success: string | null): Promise<void> {
    if (this.state.busy) return;
    this.state.busy = true;
    this.state.message = "Loading itinerary…";
    this.notify();
    try {
      const response = await this.request(url, options);
      if (!response.ok) throw new Error("Itinerary request failed.");
      const activities: unknown = await response.json();
      if (!Array.isArray(activities) || !activities.every(isActivity)) {
        throw new Error("Invalid itinerary response.");
      }
      this.state.activities = activities;
      this.state.loaded = true;
      this.state.message = success;
      this.state.failed = false;
    } catch {
      this.state.failed = true;
      this.state.message = options
        ? "Change could not be confirmed. Check that the API and database are running, then retry the action."
        : "Itinerary could not be loaded. Check that the API and database are running, then select Reload itinerary.";
    } finally {
      this.state.busy = false;
      this.notify();
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

function isActivity(value: unknown): value is ItineraryRecommendation {
  if (typeof value !== "object" || value === null) return false;
  const activity = value as Record<string, unknown>;
  return ["id", "title", "skillId", "url"].every((key) => typeof activity[key] === "string")
    && ["elective", "project", "practice-resource"].includes(String(activity.type))
    && (activity.url === "" || /^https?:\/\//i.test(String(activity.url)));
}

export const itineraryStore = new ItineraryStore();
