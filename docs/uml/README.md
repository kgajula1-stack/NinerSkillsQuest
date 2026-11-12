# UML diagrams

These diagrams describe the **proposed** relational persistence layer, not an
implemented backend. The existing Vite application stores its selections in
browser `localStorage`; it does not call Prisma or a database. The identity model
and API boundary have not been selected and require team review.

- [Class diagram source](./class-diagram.puml) |
  [rendered SVG](./class-diagram.svg) maps the existing
  [Prisma model](../../prisma/schema.prisma), including keys, nullable fields,
  uniqueness and association multiplicities. See
  [data-model.md](../data-model.md) for delete behavior, status validation,
  and constraints that require service-level enforcement.
- [Sequence diagram source](./save-career-goal-sequence.puml) |
  [rendered SVG](./save-career-goal-sequence.svg) proposes the story:
  a student saves or changes a career roadmap and employer, including incomplete
  selections. The proposed service validates the request and upserts the
  student's single goal through Prisma. Authorization, the interface/service
  integration, and database access are future work, not existing features.

## AI design decision and review status

In producing this design, the AI considered treating a course-to-skill mapping
as a student's verified mastery. That interpretation was corrected: the
existing model derives possible skill exposure through `StudentCourse` and
`CourseSkill`, and does not create a `StudentSkill` mastery record. This
preserves the application's distinction between coursework and proven
proficiency. This correction was made during AI-assisted diagram preparation;
**team review and approval have not been documented** and must be recorded by
the team before claiming that the team reviewed it.

## Rendering

With Java, Graphviz and PlantUML installed locally, run from the repository root:

```powershell
java -jar C:\path\to\plantuml.jar -tsvg docs\uml\class-diagram.puml docs\uml\save-career-goal-sequence.puml
```

Render locally so project content is not sent to a remote rendering service.
Regenerate both SVG files after updating either source or the corresponding
model or workflow.
