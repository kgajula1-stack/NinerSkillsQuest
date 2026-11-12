# ITSC 3155 Lab Deliverables

## Niner Skills Quest

Niner Skills Quest is a browser-based career-planning prototype for UNC
Charlotte students. Students can record completed courses, review mapped
skills, select a career roadmap and Charlotte employer, and compare recorded
skills with career-goal targets.

This file is the shared submission index. It contains project links and shared
assignment resources so teammates can add their own contribution details in
separate files.

## Team members and individual contributions

Each teammate should document their personal work, evidence, and testing in a
separate file. This keeps the shared project links together while allowing
individual contributions to be reviewed independently.

| Team member | Individual details |
| --- | --- |
| Kaushal Gajula | [Kaushal's individual details](./kaushal-details.md) |
| Teammate 2 | Add individual details file |
| Teammate 3 | Add individual details file |

## Submission links

| Resource | Link |
| --- | --- |
| Repository | [kgajula1-stack/NinerSkillsQuest](https://github.com/kgajula1-stack/NinerSkillsQuest) |
| GitHub Issues | [Repository issues](https://github.com/kgajula1-stack/NinerSkillsQuest/issues) |
| GitHub Project | [Niner Skills Quest Project](https://github.com/users/kgajula1-stack/projects/2) |
| Figma prototype | [Niner Skills Quest — node 69:103](https://www.figma.com/design/LpfH5WzheMLebrh6dr7jyA/Niner-Skills-Quest?node-id=69-103&t=sW2OVDTOKIzr2C4g-0) |
| Completed-course issue | [Issue #1](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/1) |
| Career-goal issue | [Issue #2](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/2) |
| Skill-comparison issue | [Issue #3](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/3) |
| Completed-course pull request | [PR #20](https://github.com/kgajula1-stack/NinerSkillsQuest/pull/20) |
| Skill-comparison pull request | [PR #21](https://github.com/kgajula1-stack/NinerSkillsQuest/pull/21) |

## Shared project resources

- [Issue #1 plan](./issue-1-plan.md)
- [Issue #1 test results](./issue-1-test-results.md)
- [Issue #2 plan](./issue-2-plan.md)
- [Issue #2 test results](./issue-2-test-results.md)
- [Issue #3 test results](./issue-3-test-results.md)
- [Issue #4 plan](./issue-4-plan.md)
- [Issue #4 test results](./issue-4-test-results.md)
- [Carter's individual details](./carter-details.md)
- [Kaushal's individual details](./kaushal-details.md)
- [Proposed persistence UML diagrams and AI design review status](./uml/README.md)

## Shared project evidence

The following evidence applies to the team project rather than one individual
contributor.

### Application evidence

![Empty application state](./screenshots/feature-empty-state.png)

![Course and career-goal workflow](./screenshots/feature-course-and-goal.png)

### Sprint 1 evidence

![GitHub Issues](./screenshots/githubIssues.png)

![Sprint 1 Project board](./screenshots/githubProjectboard.png)

### Shared limitations

The current application is a local prototype. It does not yet include real
authentication, account isolation, backend services, transcript upload,
official catalog data, verified employer requirements, verified skill mastery,
or project and experience entry.

## Shared verification

Run from the repository root:

```sh
npm install
npm test
npm run build
```

Latest recorded result:

| Check | Result |
| --- | --- |
| `npm test` | Passed — 5 test files, 27 tests |
| `npm run build` | Passed — TypeScript check and Vite production build |

The current application is a local demo using illustrative course mappings and
fictional employer profiles. Course mappings represent possible exposure, not
verified mastery.

## Shared final checklist

- [x] Repository URL included
- [x] GitHub Issues URL included
- [x] GitHub Project URL included
- [x] Figma prototype URL included
- [x] Implemented issue links included
- [x] Pull request links included
- [x] Shared testing results documented
- [x] Shared evidence links included
- [ ] Each teammate's individual details added in a separate file
- [ ] Figma MCP design-context screenshot added after the rate limit resets
