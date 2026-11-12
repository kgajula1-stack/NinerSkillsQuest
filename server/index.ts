import "dotenv/config";
import { createDatabase } from "./database";
import { createApiServer } from "./http";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env first.");
}
const db = createDatabase(url);
const server = createApiServer(db);
server.listen(3001, "127.0.0.1", () => {
  console.log("Demo database API listening on http://127.0.0.1:3001");
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
  });
}
