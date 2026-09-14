import { beforeAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// Safety guard: the suite truncates every table. Refuse to run against
// anything that is not obviously a test database.
const dbName = new URL(process.env.DATABASE_URL ?? "").pathname.replace(/^\//, "");
if (!dbName.endsWith("_test")) {
  throw new Error(
    `Refusing to run tests against database "${dbName}". ` +
      `DATABASE_URL must point at a database whose name ends in "_test" (see .env.test.example).`,
  );
}

// Runs once per test file. Tests run serially (see vitest.config.ts), so
// truncating all public tables here gives each file a clean slate and stays
// correct as new tables are added.
beforeAll(async () => {
  const rows = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '\_\_drizzle%'`,
  );
  const names = rows.map((r) => `"${r.tablename}"`).join(", ");
  if (names) await db.execute(sql.raw(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`));
});
