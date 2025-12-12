import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
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
  postType: text("post_type").$type<"reel" | "story" | "post" | "short">(),
  platform: text("platform").$type<"instagram" | "tiktok" | "youtube" | "all">(),
  category: text("category").notNull(),
  status: text("status").notNull().$type<"posted" | "scheduled" | "draft" | "processing">(),
  scheduledDate: timestamp("scheduled_date"),
  publishedDate: timestamp("published_date"),
  caption: text("caption"),
  captionTone: text("caption_tone"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  comments: integer("comments").default(0),
  reach: integer("reach").default(0),
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
  notifyMe: boolean("notify_me").default(false),
  calendarEventId: text("calendar_event_id"),
  instagramPostId: text("instagram_post_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const instagramSettings = pgTable("instagram_settings", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token"),
  businessAccountId: text("business_account_id"),
  igUserId: text("ig_user_id"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isConnected: boolean("is_connected").default(false),
  autoPublish: boolean("auto_publish").default(false),
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

export const insertInstagramSettingsSchema = createInsertSchema(instagramSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type StrategySettings = typeof strategySettings.$inferSelect;
export type InsertStrategySettings = z.infer<typeof insertStrategySettingsSchema>;
export type InstagramSettings = typeof instagramSettings.$inferSelect;
export type InsertInstagramSettings = z.infer<typeof insertInstagramSettingsSchema>;
