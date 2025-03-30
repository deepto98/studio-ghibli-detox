import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
    username: true,
    password: true,
});

export const images = pgTable("images", {
    id: serial("id").primaryKey(),
    originalImageUrl: text("original_image_url"),
    detoxifiedImageUrl: text("detoxified_image_url"),
    diagnosisPoints: text("diagnosis_points").array(),
    treatmentPoints: text("treatment_points").array(),
    contaminationLevel: integer("contamination_level"),
    userId: integer("user_id").references(() => users.id),
    shareableUrl: text("shareable_url"),
});

export const insertImageSchema = createInsertSchema(images)
    .omit({
        id: true,
    })
    .transform((data) => ({
        originalImageUrl: data.originalImageUrl || null,
        detoxifiedImageUrl: data.detoxifiedImageUrl || null,
        diagnosisPoints: data.diagnosisPoints || [],
        treatmentPoints: data.treatmentPoints || [],
        contaminationLevel: data.contaminationLevel || 0,
        userId: data.userId || null,
        shareableUrl: data.shareableUrl || null,
    }));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Image = typeof images.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;

export type ImageAnalysisResponse = {
    diagnosisPoints: string[];
    treatmentPoints: string[];
    contaminationLevel: number;
    detoxifiedImageUrl: string;
    id?: number;
    shareableUrl?: string;
    originalImageUrl?: string;
};