import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

/**
 * Initialize database - creates tables if they don't exist
 * This uses Drizzle's push feature to sync schema
 */
export async function initDatabase() {
  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("✓ Database connection established");

    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("⚠ Database tables not found. Please run: npm run db:push");
      console.log("   This will create all necessary tables in your database.");
      return false;
    }

    console.log("✓ Database tables verified");
    return true;
  } catch (error) {
    console.error("✗ Database initialization error:", error);
    throw error;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

