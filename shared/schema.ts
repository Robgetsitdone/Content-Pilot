import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type").$type<"image" | "video">(),
  category: text("category").notNull(),
  status: text("status").notNull().$type<"posted" | "scheduled" | "draft" | "processing">(),
  scheduledDate: timestamp("scheduled_date"),
  caption: text("caption"),
  captionTone: text("caption_tone"),
  views: integer("views").default(0),
  aiData: jsonb("ai_data").$type<{
    captions: Array<{
      id: string;
      tone: string;
      text: string;
      hashtags: string[];
    }>;
    extendedPost?: string;
    music: string[];
    stickers: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const strategySettings = pgTable("strategy_settings", {
  id: serial("id").primaryKey(),
  dripFrequency: integer("drip_frequency").notNull().default(5),
  categoryWeights: jsonb("category_weights").notNull().$type<Record<string, number>>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStrategySettingsSchema = createInsertSchema(strategySettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type StrategySettings = typeof strategySettings.$inferSelect;
export type InsertStrategySettings = z.infer<typeof insertStrategySettingsSchema>;
