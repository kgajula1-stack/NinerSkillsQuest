import { courses, skillsById } from "./data/catalog";
import { careerRoadmaps, employerProfiles } from "./data/careerGoals";
import { careerGoalStore } from "./state/careerGoalStore";
import { courseSelectionStore } from "./state/courseSelectionStore";
import { requestDatabaseCourses } from "./state/databaseCourses";
import { demoSessionStore } from "./state/demoSessionStore";
import { getRecommendationsForSkill } from "./data/recommendations";
import { compareTargetSkills } from "./data/skillGap";
import { recommendationStore } from "./state/recommendationStore";
import "./style.css";

function getApplicationRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#root");
  if (!element) {
    throw new Error("Application root element was not found.");
  }
  return element;
}

const root = getApplicationRoot();
const announcer = document.querySelector<HTMLDivElement>("#announcer");
let searchQuery = "";
let draftCourseId = "";
let databaseBusy = false;
let databaseMessage = "";

type AppPage = "career-goal" | "courses" | "skill-review";

function getActivePage(): AppPage {
  const page = window.location.hash.slice(1);
  return page === "career-goal" || page === "skill-review" ? page : "courses";
}

function announce(message: string): void {
  if (announcer) {
    announcer.textContent = message;
  }
}

function getCareerGoalAnnouncementText(careerGoal: ReturnType<typeof careerGoalStore.getState>): string {
  if (!careerGoal.selectedRoadmapId && !careerGoal.selectedEmployerId) {
    return "Choose a career roadmap and a Charlotte employer to set your goal.";
  }

  if (!careerGoal.selectedRoadmapId) {
    return "Career employer selected. Choose a career roadmap to complete your goal.";
  }

  if (!careerGoal.selectedEmployerId) {
    return "Career roadmap selected. Choose a Charlotte employer to complete your goal.";
  }

  const roadmapName = careerGoal.selectedRoadmap?.name ?? "Selected roadmap";
  const employerName = careerGoal.selectedEmployer?.name ?? "Selected employer";
  const targetSkillNames =
    careerGoal.selectedRoadmap?.skillIds
      .map((skillId) => skillsById.get(skillId)?.name)
      .filter((skillName): skillName is string => Boolean(skillName)) ?? [];

  if (targetSkillNames.length === 0) {
    return `Career goal set to ${roadmapName} with ${employerName}. No target skills are mapped to this roadmap.`;
  }

  return `Career goal set to ${roadmapName} with ${employerName}. Target skills: ${targetSkillNames.join(", ")}.`;
}

function getSaveAnnouncementText(
  courseState: ReturnType<typeof courseSelectionStore.getState>,
  careerGoal: ReturnType<typeof careerGoalStore.getState>,
): string {
  const courseMessage =
    courseState.persistenceMessage ??
    `${courseState.completedCourses.length} course${courseState.completedCourses.length === 1 ? "" : "s"} saved locally.`;

  if (!careerGoal.selectedRoadmapId || !careerGoal.selectedEmployerId) {
    const goalPrompt = getCareerGoalAnnouncementText(careerGoal);
    return `${courseMessage} ${goalPrompt}`;
  }

  const goalMessage =
    careerGoal.persistenceMessage ??
    `Career goal saved: ${careerGoal.selectedRoadmap?.name ?? "Selected roadmap"} with ${careerGoal.selectedEmployer?.name ?? "Selected employer"}.`;

  return `${courseMessage} ${goalMessage}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function render(focusTarget?: string): void {
  const session = demoSessionStore.getState();
  if (!session.signedIn) {
    root.innerHTML = `
      <main class="app-shell sign-in-shell" aria-labelledby="page-title">
        <header class="panel-heading">
          <div>
            <h1 id="page-title">Niner Skills Quest</h1>
            <p>Start a local demo session to explore the course and career-goal prototype.</p>
          </div>
          <span class="demo-badge">Local demo</span>
        </header>
        <section class="sign-in-card" aria-labelledby="sign-in-title">
          <h2 id="sign-in-title">Demo access</h2>
          <p>This prototype does not authenticate identities or protect personal data. Use sample information only.</p>
          <button class="button button-primary demo-sign-in" type="button">Start local demo</button>
          ${session.message ? `<p class="storage-message" role="alert">${escapeHtml(session.message)}</p>` : ""}
        </section>
      </main>
    `;
    root.querySelector<HTMLButtonElement>(".demo-sign-in")?.addEventListener("click", () => {
      demoSessionStore.startDemoSession();
    });
    return;
  }

  const activePage = getActivePage();
  const careerGoal = careerGoalStore.getState();
  const startingPointLabel = careerGoal.selectedRoadmap?.name ?? "career";
  const pageHeading = {
    "career-goal": {
      title: "Choose your career goal",
      description: "Choose a direction to compare your course skills against.",
    },
    courses: {
      title: "Add what you already know",
      description: `Build your ${escapeHtml(startingPointLabel)} starting point.`,
    },
    "skill-review": {
      title: "Review your skills",
      description: "Compare course-mapped skills with your career goal.",
    },
  }[activePage];
  const state = courseSelectionStore.getState();
  const selectedIds = new Set(state.completedCourseIds);
  const availableCourses = courses.filter((course) => !selectedIds.has(course.id));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingCourses = availableCourses.filter((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(normalizedQuery),
  );
  const exactMatch = matchingCourses.find(
    (course) =>
      course.code.toLowerCase() === normalizedQuery ||
      course.title.toLowerCase() === normalizedQuery,
  );
  if (exactMatch) {
    draftCourseId = exactMatch.id;
  } else if (draftCourseId && !matchingCourses.some((course) => course.id === draftCourseId)) {
    draftCourseId = "";
  }

  const draftCourse = courses.find((course) => course.id === draftCourseId);
  const hasSearchResults = Boolean(
    normalizedQuery && !draftCourse && matchingCourses.length > 0,
  );
  const draftSkills =
    draftCourse?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];
  const targetSkills =
    careerGoal.selectedRoadmap?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];
  const skillComparison = compareTargetSkills(
    state.skills.map((skill) => skill.id),
    careerGoal.targetProfile?.skillIds ?? null,
  );
  recommendationStore.setMissingSkillIds(skillComparison.unmatchedTargetSkillIds);
  const recommendationState = recommendationStore.getState();
  const selectedMissingSkillId = recommendationState.selectedSkillId;
  const selectedRecommendation =
    selectedMissingSkillId !== null ? getRecommendationsForSkill(selectedMissingSkillId) : null;
  const getSkillNames = (skillIds: string[]) =>
    skillIds.map((skillId) => skillsById.get(skillId)?.name ?? skillId);
  const careerGoalPrompt =
    !careerGoal.selectedRoadmapId && !careerGoal.selectedEmployerId
      ? "Choose a career roadmap and a Charlotte employer to set your goal."
      : !careerGoal.selectedRoadmapId
        ? "Choose a career roadmap to complete your goal."
        : !careerGoal.selectedEmployerId
          ? "Choose a Charlotte employer to complete your goal."
          : "";
  const searchHelp =
    courses.length === 0
      ? "No supported courses are available in this demo yet."
      : availableCourses.length === 0
        ? "You have added every supported demo course."
        : normalizedQuery && matchingCourses.length === 0
          ? "No matching courses. Try another code or name."
          : normalizedQuery && !draftCourse
            ? `${matchingCourses.length} matching course${matchingCourses.length === 1 ? "" : "s"}.`
            : "";
  const activeElement = document.activeElement;
  const activeFocusTarget =
    focusTarget ??
    (activeElement instanceof HTMLElement ? activeElement.dataset.focusTarget : undefined);
  const selectionStart =
    activeElement instanceof HTMLInputElement ? activeElement.selectionStart : null;
  const selectionEnd =
    activeElement instanceof HTMLInputElement ? activeElement.selectionEnd : null;

  root.innerHTML = `
    <main class="app-shell" aria-labelledby="page-title">
      <header class="panel-heading">
        <div>
          <h1 id="page-title">${pageHeading.title}</h1>
          <p>${pageHeading.description}</p>
        </div>
        <div class="session-controls">
          <span class="demo-badge">Local demo session</span>
          <button class="text-button sign-out-button" type="button">Sign out</button>
        </div>
      </header>

      <nav class="page-navigation" aria-label="Main navigation">
        <a
          href="#career-goal"
          data-focus-target="page-career-goal"
          ${activePage === "career-goal" ? 'aria-current="page"' : ""}
        >
          Career goal
        </a>
        <a
          href="#courses"
          data-focus-target="page-courses"
          ${activePage === "courses" ? 'aria-current="page"' : ""}
        >
          Courses
        </a>
        <a
          href="#skill-review"
          data-focus-target="page-skill-review"
          ${activePage === "skill-review" ? 'aria-current="page"' : ""}
        >
          Skill review
        </a>
      </nav>

      <section
        class="career-goal feature-page"
        aria-labelledby="career-goal-title"
        ${activePage !== "career-goal" ? "hidden" : ""}
      >
        <div class="career-goal-heading">
          <h2 id="career-goal-title">Choose your career goal</h2>
          <p>Pick a roadmap and a Charlotte employer to define your target profile.</p>
        </div>
        <div class="goal-fields">
          <div class="field">
            <label for="career-roadmap">Career roadmap</label>
            <select
              id="career-roadmap"
              data-focus-target="career-roadmap"
              aria-describedby="career-goal-prompt"
            >
              <option value="">Select a roadmap</option>
              ${careerRoadmaps
                .map(
                  (roadmap) => `
                    <option
                      value="${escapeHtml(roadmap.id)}"
                      ${careerGoal.selectedRoadmapId === roadmap.id ? "selected" : ""}
                    >
                      ${escapeHtml(roadmap.name)}
                    </option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="career-employer">Charlotte employer</label>
            <select
              id="career-employer"
              data-focus-target="career-employer"
              aria-describedby="career-goal-prompt"
            >
              <option value="">Select an employer</option>
              ${employerProfiles
                .map(
                  (employer) => `
                    <option
                      value="${escapeHtml(employer.id)}"
                      ${careerGoal.selectedEmployerId === employer.id ? "selected" : ""}
                    >
                      ${escapeHtml(employer.name)}
                    </option>`,
                )
                .join("")}
            </select>
          </div>
        </div>
        ${
          careerGoalPrompt
            ? `<p id="career-goal-prompt" class="goal-prompt" role="status">${escapeHtml(careerGoalPrompt)}</p>`
            : `<p id="career-goal-prompt" class="sr-only" role="status">Career goal selected.</p>`
        }
        ${
          careerGoal.targetProfile && careerGoal.selectedRoadmap && careerGoal.selectedEmployer
            ? `<div class="goal-summary" aria-live="polite">
                <p class="goal-summary-label">Current goal</p>
                <h3>${escapeHtml(careerGoal.selectedRoadmap.name)} · ${escapeHtml(careerGoal.selectedEmployer.name)}</h3>
                <p class="goal-employer-details">
                  ${escapeHtml(careerGoal.selectedEmployer.industry)} · ${escapeHtml(careerGoal.selectedEmployer.location)}
                </p>
                <h4>Roadmap skill targets</h4>
                ${
                  targetSkills.length > 0
                    ? `<ul class="skill-tags goal-skill-tags" aria-label="Target skills for ${escapeHtml(careerGoal.selectedRoadmap.name)}">
                        ${targetSkills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="goal-prompt">No target skills are currently mapped to this roadmap.</p>`
                }
              </div>`
            : ""
        }
        ${
          careerGoal.targetProfile
            ? `<p class="goal-status" aria-live="polite">${escapeHtml(getCareerGoalAnnouncementText(careerGoal))}</p>`
            : ""
        }
        <p class="goal-demo-note">
          Employer profiles and target skill mappings are illustrative local-demo data.
        </p>
      </section>

      <section
        class="course-workflow feature-page"
        aria-label="Add completed courses"
        ${activePage !== "courses" ? "hidden" : ""}
      >
      <nav class="entry-tabs" aria-label="Experience type">
        <button class="entry-tab is-active" type="button" aria-current="page">Course</button>
        <button
          class="entry-tab"
          type="button"
          disabled
          aria-label="Project or experience entry is not included in this demo"
        >
          Project or experience
        </button>
      </nav>

      <form id="course-form" class="course-form">
        <div class="field search-field">
          <label for="course-search">Search by course code or name</label>
          <input
            id="course-search"
            data-focus-target="course-search"
            type="search"
            value="${escapeHtml(searchQuery)}"
            placeholder="Search supported courses"
            autocomplete="off"
            ${hasSearchResults ? 'aria-controls="course-search-results"' : ""}
            aria-describedby="course-search-help"
          />
          ${
            searchHelp
              ? `<p id="course-search-help" class="field-help">${escapeHtml(searchHelp)}</p>`
              : ""
          }
          ${
            hasSearchResults
              ? `<ul id="course-search-results" class="search-results" aria-label="Matching supported courses">
                  ${matchingCourses
                    .map(
                      (course) => `
                        <li>
                          <button
                            class="search-result"
                            type="button"
                            data-select-course="${escapeHtml(course.id)}"
                          >
                            <span class="search-result-code">${escapeHtml(course.code)}</span>
                            <span>${escapeHtml(course.title)}</span>
                          </button>
                        </li>`,
                    )
                    .join("")}
                </ul>`
              : ""
          }
        </div>

        ${
          draftCourse
            ? `<section class="course-preview" aria-label="Selected course">
                <h2>${escapeHtml(draftCourse.code)} — ${escapeHtml(draftCourse.title)}</h2>
                <p>UNC Charlotte · course label from your existing pathway</p>
                <span class="selected-tag">✓ Selected course</span>
              </section>`
            : ""
        }

        ${
          draftCourse
            ? `<section class="course-status" aria-labelledby="status-title">
                <h2 id="status-title">Course status</h2>
                <div class="status-tags">
                  <span class="status-tag is-completed">● Completed</span>
                  <span
                    class="status-tag is-unavailable"
                    aria-label="In progress status is outside this completed-course demo"
                    title="This feature only tracks completed courses."
                  >
                    ○ In progress
                  </span>
                </div>
              </section>`
            : ""
        }

        ${
          draftCourse
            ? `<section class="suggested-skills" aria-labelledby="suggested-title">
                <h2 id="suggested-title">Review suggested skills</h2>
                <p>Suggested skills are based on the course mapping, not verified mastery.</p>
                ${
                  draftSkills.length > 0
                    ? `<ul class="skill-tags" aria-label="Skills suggested by this course">
                        ${draftSkills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="skill-empty">No mapped skills are available for this course yet.</p>`
                }
                <p class="skill-source-note">Mapped from the supported course catalog.</p>
              </section>`
            : ""
        }

        <button class="button button-secondary add-button" type="submit" ${
          draftCourse ? "" : "disabled"
        }>
          Add course to list
        </button>
      </form>

      <section class="added-items" aria-labelledby="added-title">
        <h2 id="added-title">Added items · ${state.completedCourses.length}</h2>
        ${
          state.completedCourses.length > 0
            ? `<ul class="selected-list">
                ${state.completedCourses
                  .map((course) => {
                    const courseSkills = course.skillIds
                      .map((skillId) => skillsById.get(skillId)?.name)
                      .filter((name): name is string => Boolean(name));
                    return `
                      <li class="selected-course">
                        <div class="selected-course-copy">
                          <h3>${escapeHtml(course.code)} — ${escapeHtml(course.title)}</h3>
                          <p>Completed${courseSkills.length > 0
                            ? ` · ${courseSkills.map(escapeHtml).join(", ")}`
                            : ""}</p>
                        </div>
                        <button
                          class="text-button remove-button"
                          type="button"
                          data-remove-course="${escapeHtml(course.id)}"
                          aria-label="Remove ${escapeHtml(course.code)} — ${escapeHtml(course.title)}"
                        >
                          Remove
                        </button>
                      </li>`;
                  })
                  .join("")}
              </ul>
              <div class="added-skills" aria-labelledby="mapped-title">
                <h3 id="mapped-title">Mapped skills · ${state.skills.length}</h3>
                ${
                  state.skills.length > 0
                    ? `<ul class="skill-tags" aria-label="Mapped skills from completed courses">
                        ${state.skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="mapped-empty">No mapped skills are available for the selected courses.</p>`
                }
              </div>`
            : draftCourse
              ? ""
              : `<p class="mapped-empty">No courses selected yet. Add a supported course to see its mapped skills.</p>`
        }
      </section>
      <section class="database-workflow" aria-labelledby="database-title">
        <h2 id="database-title">Shared demo database</h2>
        <p>Save replaces the shared sample student's database list. Load replaces this browser's list. Use sample data only.</p>
        <div class="database-actions">
          <button class="button button-secondary" type="button" data-database-action="save" ${databaseBusy ? "disabled" : ""}>Save courses to database</button>
          <button class="button button-secondary" type="button" data-database-action="load" ${databaseBusy ? "disabled" : ""}>Load courses from database</button>
        </div>
        ${databaseMessage ? `<p role="status">${escapeHtml(databaseMessage)}</p>` : ""}
      </section>
      </section>

      <section
        class="skill-review-workflow feature-page"
        aria-label="Skill comparison and recommendations"
        ${activePage !== "skill-review" ? "hidden" : ""}
      >
      <section class="skill-gap" aria-labelledby="skill-gap-title" aria-live="polite">
        <h2 id="skill-gap-title">Compare your skills with your goal</h2>
        ${
          skillComparison.status === "missing-goal"
            ? `<p class="goal-prompt">Choose a career roadmap and employer to see how recorded course skills compare.</p>`
            : skillComparison.status === "empty-target"
              ? `<p class="goal-prompt">This career goal has no target skills to compare yet.</p>`
              : `
                <p class="skill-gap-note">
                  Course mappings show possible exposure only. A target skill not recorded here does not mean you lack it.
                </p>
                <div class="skill-gap-group">
                  <h3>Matches · ${skillComparison.matchedSkillIds.length}</h3>
                  ${
                    skillComparison.matchedSkillIds.length > 0
                      ? `<ul class="skill-tags" aria-label="Target skills matched by recorded courses">
                          ${getSkillNames(skillComparison.matchedSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                      : `<p class="mapped-empty">No target skills match the currently recorded course skills.</p>`
                  }
                </div>
                <div class="skill-gap-group">
                  <h3>Not recorded from courses · ${skillComparison.unmatchedTargetSkillIds.length}</h3>
                  ${
                    skillComparison.unmatchedTargetSkillIds.length > 0
                      ? `<ul class="skill-tags goal-skill-tags" aria-label="Target skills not recorded from courses">
                          ${getSkillNames(skillComparison.unmatchedTargetSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                      : `<p class="mapped-empty">Every target skill is represented in the current course mappings.</p>`
                  }
                </div>
              `
        }
      </section>

      ${
        skillComparison.status === "ready" && recommendationState.availableSkillIds.length > 0
          ? `
            <section class="recommendations" aria-labelledby="recommendations-title">
              <h2 id="recommendations-title">Missing-skill recommendations</h2>
              <div class="field">
                <label for="recommendation-skill">Choose a missing skill</label>
                <select id="recommendation-skill" data-focus-target="recommendation-skill">
                  ${recommendationState.availableSkillIds
                    .map(
                      (skillId) => `
                        <option value="${escapeHtml(skillId)}" ${selectedMissingSkillId === skillId ? "selected" : ""}>
                          ${escapeHtml(skillsById.get(skillId)?.name ?? skillId)}
                        </option>`,
                    )
                    .join("")}
                </select>
              </div>
              ${
                selectedRecommendation
                  ? `
                    <div class="recommendation-panel">
                      <div class="recommendation-group">
                        <h3>UNC Charlotte electives</h3>
                        ${
                          selectedRecommendation.electives.length > 0
                            ? `<ul class="skill-tags">
                                ${selectedRecommendation.electives
                                  .map(
                                    (course) => `
                                      <li>
                                        <a href="${escapeHtml(course.url)}" target="_blank" rel="noreferrer">${escapeHtml(course.code)} — ${escapeHtml(course.title)}</a>
                                      </li>`,
                                  )
                                  .join("")}
                              </ul>`
                            : `<p class="mapped-empty">No UNC Charlotte electives are available for this skill yet.</p>`
                        }
                      </div>
                      <div class="recommendation-group">
                        <h3>Practice resources</h3>
                        ${
                          selectedRecommendation.resources.length > 0
                            ? `<ul class="skill-tags goal-skill-tags">
                                ${selectedRecommendation.resources
                                  .map(
                                    (resource) => `
                                      <li>
                                        <a href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title)}</a>
                                      </li>`,
                                  )
                                  .join("")}
                              </ul>`
                            : `<p class="mapped-empty">No practice resources are available for this selected skill yet.</p>`
                        }
                      </div>
                    </div>
                  `
                  : `<p class="mapped-empty">No course or resource is available for this selected skill.</p>`
              }
            </section>
          `
          : skillComparison.status === "ready"
            ? `
              <section class="recommendations" aria-labelledby="recommendations-title">
                <h2 id="recommendations-title">Missing-skill recommendations</h2>
                <p class="mapped-empty">No missing skills are available for recommendations right now.</p>
              </section>
            `
            : ""
      }
      </section>

      <button class="button button-primary save-button" type="button">
        Save and continue →
      </button>

      <p class="disclaimer">
        Coursework suggests exposure, not verified mastery. Course availability and
        requirements must be checked in the official catalog.
      </p>
      ${[session.message, state.persistenceMessage, careerGoal.persistenceMessage]
        .filter((message): message is string => message !== null)
        .map((message) => `<p class="storage-message" role="status">${escapeHtml(message)}</p>`)
        .join("")}
    </main>
  `;

  if (activeFocusTarget) {
    const nextFocus = root.querySelector<HTMLElement>(
      `[data-focus-target="${activeFocusTarget}"]`,
    );
    nextFocus?.focus();
    if (
      nextFocus instanceof HTMLInputElement &&
      selectionStart !== null &&
      selectionEnd !== null
    ) {
      nextFocus.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  const searchInput = root.querySelector<HTMLInputElement>("#course-search");
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    draftCourseId = "";
    render("course-search");
  });

  root.querySelectorAll<HTMLButtonElement>("[data-select-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.selectCourse;
      if (courseId) {
        draftCourseId = courseId;
        render("course-search");
      }
    });
  });

  root.querySelector<HTMLFormElement>("#course-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const course = courses.find((candidate) => candidate.id === draftCourseId);
    if (!course) {
      return;
    }

    searchQuery = "";
    draftCourseId = "";
    courseSelectionStore.addCourse(course.id);
    announce(`Added ${course.code} — ${course.title}.`);
  });

  root.querySelector<HTMLSelectElement>("#recommendation-skill")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      recommendationStore.setSelectedSkillId(select.value || null);
      render("recommendation-skill");
    }
  });

  root.querySelector<HTMLSelectElement>("#career-roadmap")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      careerGoalStore.selectRoadmap(select.value || null);
      const updatedGoal = careerGoalStore.getState();
      const selectedRoadmap = updatedGoal.selectedRoadmap?.name ?? "selected roadmap";
      const employerStatus = updatedGoal.selectedEmployer
        ? ` with ${updatedGoal.selectedEmployer.name} selected.`
        : ".";
      announce(`Career roadmap changed to ${selectedRoadmap}${employerStatus}`);
    }
  });

  root.querySelector<HTMLSelectElement>("#career-employer")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      careerGoalStore.selectEmployer(select.value || null);
      const updatedGoal = careerGoalStore.getState();
      const employerName = updatedGoal.selectedEmployer?.name ?? "selected employer";
      const roadmapStatus = updatedGoal.selectedRoadmap
        ? ` for ${updatedGoal.selectedRoadmap.name}.`
        : ".";
      announce(`Career employer changed to ${employerName}${roadmapStatus}`);
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.removeCourse;
      const course = courses.find((candidate) => candidate.id === courseId);
      if (courseId) {
        courseSelectionStore.removeCourse(courseId);
        if (course) {
          announce(`Removed ${course.code} — ${course.title}.`);
        }
      }
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-database-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.databaseAction;
      if (action !== "save" && action !== "load") return;
      const originalIds = courseSelectionStore.getState().completedCourseIds;
      databaseBusy = true;
      databaseMessage = action === "save" ? "Saving courses to the database..." : "Loading courses from the database...";
      render();
      void requestDatabaseCourses(action === "save" ? originalIds : undefined).then((ids) => {
        if (action === "load") {
          if (JSON.stringify(courseSelectionStore.getState().completedCourseIds) !== JSON.stringify(originalIds)) {
            databaseMessage = "The browser list changed while loading; it was not replaced. Try again.";
          } else {
            courseSelectionStore.replaceCourses(ids);
            databaseMessage = "Courses loaded from the shared demo database.";
          }
        } else {
          databaseMessage = JSON.stringify(courseSelectionStore.getState().completedCourseIds) === JSON.stringify(originalIds)
            ? "Course list saved to the shared demo database."
            : "The earlier course list was saved, but this browser's list has since changed. Save again to update the database.";
        }
      }).catch((error: unknown) => {
        databaseMessage = `Database ${action} failed: ${error instanceof Error ? error.message : "Unknown error."} Check that the database server is running.`;
      }).finally(() => {
        databaseBusy = false;
        render();
        announce(databaseMessage);
      });
    });
  });

  root.querySelector<HTMLButtonElement>(".save-button")?.addEventListener("click", () => {
    announce(getSaveAnnouncementText(state, careerGoal));
  });

  root.querySelector<HTMLButtonElement>(".sign-out-button")?.addEventListener("click", () => {
    demoSessionStore.signOut();
  });
}

courseSelectionStore.subscribe(() => render("course-search"));
careerGoalStore.subscribe(() => render());
demoSessionStore.subscribe(() => render());
window.addEventListener("hashchange", () => render());
render();
