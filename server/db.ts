import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// For development, we'll use a mock connection
// In production, this would connect to actual Postgres
const sql = neon(process.env.DATABASE_URL || "postgresql://localhost:5432/auracare");
export const db = drizzle(sql);
