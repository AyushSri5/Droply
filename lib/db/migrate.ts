import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as dotenv from "dotenv";

dotenv.config();

if(!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

async function runMigration() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        const db = drizzle(sql);
        await migrate(db, {migrationsFolder: "./drizzle"});
        console.log("Migration completed successfully");
        
    } catch (error) {
        console.error("Error during migration:", error);
        process.exit(1);
    }
}

runMigration()