import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
});

export const images = pgTable("images", {
    id: serial("id").primaryKey(),
    originalImageKey: text("original_image_key").notNull(),
    detoxifiedImageKey: text("detoxified_image_key").notNull(),
    diagnosisPoints: text("diagnosis_points").array(),
    treatmentPoints: text("treatment_points").array(),
    contaminationLevel: integer("contamination_level").notNull(),
    userId: integer("user_id").references(() => users.id),
    description: text("description"),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});

export const insertImageSchema = createInsertSchema(images)
    .omit({
        id: true,
        createdAt: true,

    })
    .transform((data) => ({
        originalImageKey: data.originalImageKey,
        detoxifiedImageKey: data.detoxifiedImageKey,
        diagnosisPoints: data.diagnosisPoints || [],
        treatmentPoints: data.treatmentPoints || [],
        contaminationLevel: data.contaminationLevel,
        userId: data.userId || null,
        description: data.description || null,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
    }));

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

// Analysis Response Type

export type ImageAnalysisResponse = {
    diagnosisPoints: string[];
    treatmentPoints: string[];
    contaminationLevel: number;
    detoxifiedImageUrl: string;
    originalImageUrl: string;
    id?: number;
    description?: string;
    shareableUrl?: string;
 };