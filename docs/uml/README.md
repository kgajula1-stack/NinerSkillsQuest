# UML diagrams

- `class-diagram.puml` describes the PostgreSQL Prisma 6 model.
- `sequence-course-save.puml` describes the implemented manual-course API.

Render updated sources locally with PlantUML and Graphviz:

```powershell
java -jar C:\path\to\plantuml.jar -tsvg docs/uml/class-diagram.puml docs/uml/sequence-course-save.puml
```

Earlier SQLite class and career-goal SVGs were removed because they no longer
match the PostgreSQL schema. Updated rendered images still need to be produced
for the assignment. Career-goal database persistence is not implemented.
See `../ai-design-review.md` for migration decisions and review limitations.
