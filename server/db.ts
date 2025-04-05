import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, images } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config(); // This loads the .env file contents into process.env

// Initialize the Postgres client
const client = postgres(process.env.DATABASE_URL || "");
export const db = drizzle(client);

// Database Interface
export interface IDatabase {
    getUser(id: number): Promise<typeof users.$inferSelect | undefined>;
    getUserByUsername(username: string): Promise<typeof users.$inferSelect | undefined>;
    createUser(user: typeof users.$inferInsert): Promise<typeof users.$inferSelect>;
    saveImage(image: typeof images.$inferInsert): Promise<typeof images.$inferSelect>;
    getImage(id: number): Promise<typeof images.$inferSelect | undefined>;
    getUserImages(userId: number): Promise<typeof images.$inferSelect[]>;
    getAllImages(): Promise<typeof images.$inferSelect[]>;
    getAllPublicImages(): Promise<typeof images.$inferSelect[]>;
    deleteImage(id: number): Promise<typeof images.$inferSelect | undefined>;
}

export class DrizzleDatabase implements IDatabase {
    async getUser(id: number): Promise<typeof users.$inferSelect | undefined> {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }

    async getUserByUsername(username: string): Promise<typeof users.$inferSelect | undefined> {
        const result = await db.select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);
        return result[0];
    }

    async createUser(user: typeof users.$inferInsert): Promise<typeof users.$inferSelect> {
        const result = await db.insert(users).values(user).returning();
        return result[0];
    }

    async saveImage(image: typeof images.$inferInsert): Promise<typeof images.$inferSelect> {
        const result = await db.insert(images).values(image).returning();
        return result[0];
    }

    async getImage(id: number): Promise<typeof images.$inferSelect | undefined> {
        const result = await db.select()
            .from(images)
            .where(eq(images.id, id))
            .limit(1);
        return result[0];
    }

    async getUserImages(userId: number): Promise<typeof images.$inferSelect[]> {
        return await db.select()
            .from(images)
            .where(eq(images.userId, userId))
            .orderBy(desc(images.createdAt));
    }

    async getAllImages(): Promise<typeof images.$inferSelect[]> {
        return await db.select().from(images).orderBy(desc(images.createdAt));
    }

    async getAllPublicImages(): Promise<typeof images.$inferSelect[]> {
        return await db.select()
            .from(images)
            .where(eq(images.isPublic, true))
            .orderBy(desc(images.createdAt));
    }


    async deleteImage(id: number): Promise<typeof images.$inferSelect | undefined> {
        // First, get the image to return it after deletion
        const image = await this.getImage(id);
        if (!image) {
            return undefined;
        }

        // Delete the image from the database
        await db.delete(images).where(eq(images.id, id));

        // Return the deleted image data
        return image;
    }
}

// Export singleton instance
export const database = new DrizzleDatabase();