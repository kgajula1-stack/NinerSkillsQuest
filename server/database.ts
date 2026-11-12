import { PrismaClient } from "@prisma/client";

// A fictional, shared local-demo identity, not an authenticated account.
export const DEMO_STUDENT_ID = "00000000-0000-4000-8000-000000000001";

export function createDatabase(url: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url } } });
}
