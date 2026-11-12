import { describe, expect, it } from "vitest";
import { courses, skills } from "../src/data/catalog";
import { CourseSelectionStore } from "../src/state/courseSelectionStore";
import type { Course, Skill } from "../src/types";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    get value() {
      return value;
    },
  };
}

describe("course selection state", () => {
  it("adds supported courses once and derives each mapped skill once", () => {
    const store = new CourseSelectionStore(createStorage());

    store.addCourse("itcs-2214");
    store.addCourse("itcs-2214");

    expect(store.getState().completedCourseIds).toEqual(["itcs-2214"]);
    expect(store.getState().skills.map((skill) => skill.id)).toEqual([
      "java",
      "object-oriented-programming",
    ]);
  });

  it("keeps a shared skill until every selected course providing it is removed", () => {
    const firstCourse: Course = {
      id: "first-course",
      code: "TEST 1000",
      title: "First Course",
      skillIds: ["java", "object-oriented-programming"],
    };
    const secondCourse: Course = {
      id: "second-course",
      code: "TEST 2000",
      title: "Second Course",
      skillIds: ["java"],
    };
    const testSkills: Skill[] = [
      { id: "java", name: "Java" },
      { id: "object-oriented-programming", name: "OOP" },
    ];
    const store = new CourseSelectionStore(
      createStorage(),
      [firstCourse, secondCourse],
      testSkills,
    );

    store.addCourse(firstCourse.id);
    store.addCourse(secondCourse.id);
    store.removeCourse(firstCourse.id);

    expect(store.getState().skills.map((skill) => skill.id)).toEqual(["java"]);
    store.removeCourse(secondCourse.id);
    expect(store.getState().skills).toEqual([]);
  });

  it("supports selected courses with no mapped skills", () => {
    const courseWithoutSkills: Course = {
      id: "unmapped-course",
      code: "TEST 3000",
      title: "Unmapped Course",
      skillIds: [],
    };
    const store = new CourseSelectionStore(createStorage(), [courseWithoutSkills], []);

    store.addCourse(courseWithoutSkills.id);

    expect(store.getState().completedCourses).toEqual([courseWithoutSkills]);
    expect(store.getState().skills).toEqual([]);
  });

  it("persists course IDs and restores them on a new store", () => {
    const storage = createStorage();
    const firstStore = new CourseSelectionStore(storage);
    firstStore.addCourse("itcs-2214");
    firstStore.addCourse("itis-3200");

    const restoredStore = new CourseSelectionStore(storage);

    expect(JSON.parse(storage.value ?? "null")).toEqual(["itcs-2214", "itis-3200"]);
    expect(restoredStore.getState().completedCourseIds).toEqual(["itcs-2214", "itis-3200"]);
    expect(restoredStore.getState().skills.map((skill) => skill.id)).toEqual([
      "java",
      "object-oriented-programming",
      "information-security",
      "networking",
    ]);
  });

  it("replaces a browser list with validated database selections", () => {
    const storage = createStorage();
    const store = new CourseSelectionStore(storage);
    store.addCourse("itcs-2214");
    store.replaceCourses(["itis-3200"]);
    expect(store.getState().skills.map((skill) => skill.id)).toEqual(["information-security", "networking"]);
    expect(new CourseSelectionStore(storage).getState().completedCourseIds).toEqual(["itis-3200"]);
    expect(() => store.replaceCourses(["unknown"])).toThrow();
    expect(() => store.replaceCourses(["itis-3200", "itis-3200"])).toThrow();
    expect(store.getState().completedCourseIds).toEqual(["itis-3200"]);
    store.replaceCourses([]);
    expect(store.getState().completedCourses).toEqual([]);
  });

  it("recovers valid saved IDs and reports skipped invalid data", () => {
    const storage = createStorage(
      JSON.stringify(["itcs-2214", "unknown-course", 4, "itcs-2214"]),
    );
    const store = new CourseSelectionStore(storage);

    expect(store.getState().completedCourseIds).toEqual(["itcs-2214"]);
    expect(store.getState().persistenceMessage).toMatch(/invalid and have been skipped/i);

    store.addCourse("itis-3200");
    expect(store.getState().persistenceMessage).toBeNull();
    expect(JSON.parse(storage.value ?? "null")).toEqual(["itcs-2214", "itis-3200"]);
  });

  it("keeps session selections and reports storage write failures", () => {
    const storage = {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {
        throw new Error("storage is full");
      },
    };
    const store = new CourseSelectionStore(storage);

    store.addCourse("itcs-2214");

    expect(store.getState().completedCourseIds).toEqual(["itcs-2214"]);
    expect(store.getState().persistenceMessage).toMatch(/could not be saved/i);
  });

  it("reports malformed saved data without preventing new selections", () => {
    const store = new CourseSelectionStore(createStorage("{not json"));

    expect(store.getState().completedCourseIds).toEqual([]);
    expect(store.getState().persistenceMessage).toMatch(/saved course data was invalid/i);

    store.addCourse(courses[0].id);
    expect(store.getState().persistenceMessage).toBeNull();
    expect(store.getState().skills).toHaveLength(2);
    expect(skills).toHaveLength(8);
  });

  it("reports failures reading saved selections", () => {
    const storage = {
      getItem: (_key: string) => {
        throw new Error("storage is blocked");
      },
      setItem: (_key: string, _value: string) => undefined,
    };
    const store = new CourseSelectionStore(storage);

    expect(store.getState().persistenceMessage).toMatch(/could not be loaded/i);
    store.addCourse("itcs-2214");
    expect(store.getState().completedCourseIds).toEqual(["itcs-2214"]);
  });
});
