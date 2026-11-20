import type { ItineraryRecommendation } from "../data/itineraryRecommendations";

export interface SavedItineraryActivity extends ItineraryRecommendation {
  completed: boolean;
}

export interface ItineraryState {
  activities: SavedItineraryActivity[];
  completedCount: number;
  busy: boolean;
  loaded: boolean;
  message: string | null;
  failed: boolean;
}

export class ItineraryStore {
  private state: ItineraryState = {
    activities: [], completedCount: 0, busy: false, loaded: false, message: null, failed: false,
  };
  private listeners = new Set<() => void>();

  constructor(private readonly request: typeof fetch = fetch) {}

  getState(): ItineraryState {
    return {
      ...this.state,
      completedCount: this.state.activities.filter((activity) => activity.completed).length,
      activities: this.state.activities.map((activity) => ({ ...activity })),
    };
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

  setCompleted(id: string, completed: boolean): Promise<void> {
    if (!this.state.loaded || !this.state.activities.some((activity) => activity.id === id)) {
      return Promise.resolve();
    }
    return this.run(`/api/itinerary/${encodeURIComponent(id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }, completed ? "Activity marked complete. Progress saved." : "Activity marked incomplete. Progress saved.");
  }

  move(id: string, direction: -1 | 1): Promise<void> {
    const activities = [...this.state.activities];
    const index = activities.findIndex((activity) => activity.id === id);
    const destination = index + direction;
    if (!this.state.loaded || this.state.busy || index < 0 || destination < 0 || destination >= activities.length) return Promise.resolve();
    [activities[index], activities[destination]] = [activities[destination], activities[index]];
    return this.run("/api/itinerary/order", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recommendationIds: activities.map((activity) => activity.id) }),
    }, "Activity order saved.", activities);
  }

  private async run(url: string, options: RequestInit | undefined, success: string | null, optimistic?: SavedItineraryActivity[]): Promise<void> {
    if (this.state.busy) return;
    const previous = this.state.activities;
    if (optimistic) this.state.activities = optimistic;
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
      if (optimistic) this.state.activities = previous;
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

function isActivity(value: unknown): value is SavedItineraryActivity {
  if (typeof value !== "object" || value === null) return false;
  const activity = value as Record<string, unknown>;
  return ["id", "title", "skillId", "url"].every((key) => typeof activity[key] === "string")
    && typeof activity.completed === "boolean"
    && ["elective", "project", "practice-resource"].includes(String(activity.type))
    && (activity.url === "" || /^https?:\/\//i.test(String(activity.url)));
}

export const itineraryStore = new ItineraryStore();
