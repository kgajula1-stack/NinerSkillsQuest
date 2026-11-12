import { courses, skills } from "../data/catalog";
import type { Course, Skill, StudentSelections } from "../types";

const STORAGE_KEY = "niner-skills-quest.completed-course-ids";

type StoragePort = Pick<Storage, "getItem" | "setItem">;

export interface CourseSelectionState extends StudentSelections {
  completedCourses: Course[];
  skills: Skill[];
  persistenceMessage: string | null;
}

type Listener = (state: CourseSelectionState) => void;

export class CourseSelectionStore {
  private readonly listeners = new Set<Listener>();
  private readonly courseById: Map<string, Course>;
  private readonly skillById: Map<string, Skill>;
  private readonly storage: StoragePort | null;
  private completedCourseIds: string[] = [];
  private persistenceMessage: string | null = null;

  constructor(
    storage?: StoragePort,
    courseCatalog: Course[] = courses,
    skillCatalog: Skill[] = skills,
  ) {
    this.courseById = new Map(courseCatalog.map((course) => [course.id, course]));
    this.skillById = new Map(skillCatalog.map((skill) => [skill.id, skill]));
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.loadSelections();
  }

  getState(): CourseSelectionState {
    const completedCourses = this.completedCourseIds
      .map((courseId) => this.courseById.get(courseId))
      .filter((course): course is Course => course !== undefined);
    const seenSkillIds = new Set<string>();
    const derivedSkills: Skill[] = [];

    for (const course of completedCourses) {
      for (const skillId of course.skillIds) {
        const skill = this.skillById.get(skillId);
        if (skill && !seenSkillIds.has(skillId)) {
          seenSkillIds.add(skillId);
          derivedSkills.push(skill);
        }
      }
    }

    return {
      completedCourseIds: [...this.completedCourseIds],
      completedCourses,
      skills: derivedSkills,
      persistenceMessage: this.persistenceMessage,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addCourse(courseId: string): void {
    if (!this.courseById.has(courseId) || this.completedCourseIds.includes(courseId)) {
      return;
    }

    this.completedCourseIds = [...this.completedCourseIds, courseId];
    this.saveSelections();
    this.notify();
  }

  removeCourse(courseId: string): void {
    if (!this.completedCourseIds.includes(courseId)) {
      return;
    }

    this.completedCourseIds = this.completedCourseIds.filter((id) => id !== courseId);
    this.saveSelections();
    this.notify();
  }

  replaceCourses(courseIds: string[]): void {
    if (
      courseIds.some((id) => !this.courseById.has(id)) ||
      new Set(courseIds).size !== courseIds.length
    ) {
      throw new Error("The database returned unsupported or duplicate courses.");
    }
    this.completedCourseIds = [...courseIds];
    this.saveSelections();
    this.notify();
  }

  private getBrowserStorage(): StoragePort | null {
    try {
      return window.localStorage;
    } catch {
      this.persistenceMessage =
        "Your selections will work for this session, but browser storage is unavailable.";
      return null;
    }
  }

  private loadSelections(): void {
    if (!this.storage) {
      return;
    }

    let savedValue: string | null;
    try {
      savedValue = this.storage.getItem(STORAGE_KEY);
    } catch {
      this.persistenceMessage =
        "Your selections will work for this session, but saved courses could not be loaded.";
      return;
    }

    if (savedValue === null) {
      return;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(savedValue);
    } catch {
      this.persistenceMessage =
        "Saved course data was invalid and has been ignored. Add courses to save a fresh list.";
      return;
    }

    if (!Array.isArray(parsedValue)) {
      this.persistenceMessage =
        "Saved course data was invalid and has been ignored. Add courses to save a fresh list.";
      return;
    }

    const recoveredIds: string[] = [];
    const seenIds = new Set<string>();
    let skippedInvalidValues = false;

    for (const value of parsedValue) {
      if (typeof value !== "string" || !this.courseById.has(value) || seenIds.has(value)) {
        skippedInvalidValues = true;
        continue;
      }

      seenIds.add(value);
      recoveredIds.push(value);
    }

    this.completedCourseIds = recoveredIds;
    if (skippedInvalidValues) {
      this.persistenceMessage =
        "Some saved course selections were invalid and have been skipped. Add or remove a course to save a clean list.";
    }
  }

  private saveSelections(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.completedCourseIds));
      this.persistenceMessage = null;
    } catch {
      this.persistenceMessage =
        "Your selections are updated for this session, but could not be saved in this browser.";
    }
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const courseSelectionStore = new CourseSelectionStore();
