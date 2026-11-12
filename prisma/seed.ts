import "dotenv/config";
import { createDatabase } from "../server/database";
import { seedDatabase } from "./seed-data";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env first.");
}

const db = createDatabase(url);
try {
  await seedDatabase(db);
  console.log("Seeded sample student, courses, skills, roadmaps, employers, recommendations, and mappings.");
} finally {
  await db.$disconnect();
}
