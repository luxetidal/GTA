import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set. Ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  // @ts-ignore: Drizzle types currently expect D1; override for PostgreSQL
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
