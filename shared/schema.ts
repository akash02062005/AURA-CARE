import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  age: integer("age"),
  gender: varchar("gender"),
  interests: text("interests").array(),
  locality: varchar("locality"),
  country: varchar("country"),
  darkMode: boolean("dark_mode").default(false),
  language: varchar("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mood assessments table
export const moodAssessments = pgTable("mood_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // "PHQ-9" or "GAD-7"
  responses: jsonb("responses").notNull(), // Array of question responses
  totalScore: integer("total_score").notNull(),
  severity: varchar("severity").notNull(), // "minimal", "mild", "moderate", "severe"
  recommendations: text("recommendations").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull(), // Array of message objects
  sentiment: varchar("sentiment"), // "positive", "neutral", "negative", "crisis"
  escalated: boolean("escalated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Counselors table
export const counselors = pgTable("counselors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  title: varchar("title").notNull(),
  specializations: text("specializations").array(),
  experience: integer("experience").notNull(),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  price: integer("price").notNull(),
  imageUrl: varchar("image_url"),
  availability: jsonb("availability").notNull(), // Schedule object
  location: varchar("location"),
  sessionTypes: text("session_types").array(), // "video", "phone", "in-person"
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  counselorId: varchar("counselor_id").notNull().references(() => counselors.id),
  date: timestamp("date").notNull(),
  sessionType: varchar("session_type").notNull(),
  status: varchar("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Forum posts table
export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  anonymous: boolean("anonymous").default(true),
  category: varchar("category").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forum replies table
export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => forumPosts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  anonymous: boolean("anonymous").default(true),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily tasks table
export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  difficulty: varchar("difficulty").notNull(), // "easy", "medium", "hard"
  points: integer("points").default(10),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User streaks table
export const userStreaks = pgTable("user_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalPoints: integer("total_points").default(0),
  badges: text("badges").array(),
  lastActiveDate: timestamp("last_active_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Virtual pets table
export const virtualPets = pgTable("virtual_pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull().default("Luna"),
  type: varchar("type").notNull().default("cat"),
  happiness: integer("happiness").default(50),
  health: integer("health").default(100),
  lastFed: timestamp("last_fed"),
  lastPlayed: timestamp("last_played"),
  level: integer("level").default(1),
  experience: integer("experience").default(0),
  evolutionStage: integer("evolution_stage").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feedback table
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // "general", "bug", "feature", "counselor"
  rating: integer("rating"), // 1-5 stars
  title: varchar("title"),
  content: text("content").notNull(),
  category: varchar("category"),
  relatedId: varchar("related_id"), // For counselor feedback, etc.
  status: varchar("status").default("pending"), // "pending", "reviewed", "resolved"
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feel-good places table
export const feelGoodPlaces = pgTable("feel_good_places", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "park", "cafe", "library", "gym", etc.
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  verified: boolean("verified").default(false),
  imageUrl: varchar("image_url"),
  amenities: text("amenities").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily content table (quotes, riddles, puzzles)
export const dailyContent = pgTable("daily_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "quote", "riddle", "puzzle"
  content: text("content").notNull(),
  author: varchar("author"),
  category: varchar("category"),
  difficulty: varchar("difficulty"), // For riddles/puzzles
  answer: text("answer"), // For riddles/puzzles
  language: varchar("language").default("en"),
  active: boolean("active").default(true),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game scores table
export const gameScores = pgTable("game_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  gameType: varchar("game_type").notNull(), // "breathing", "puzzle", "memory", etc.
  score: integer("score").notNull(),
  duration: integer("duration"), // in seconds
  difficulty: varchar("difficulty"),
  mood: varchar("mood"), // User's mood when playing
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodAssessmentSchema = createInsertSchema(moodAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeelGoodPlaceSchema = createInsertSchema(feelGoodPlaces).omit({
  id: true,
  createdAt: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type MoodAssessment = typeof moodAssessments.$inferSelect;
export type InsertMoodAssessment = z.infer<typeof insertMoodAssessmentSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type Counselor = typeof counselors.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type UserStreak = typeof userStreaks.$inferSelect;
export type VirtualPet = typeof virtualPets.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type FeelGoodPlace = typeof feelGoodPlaces.$inferSelect;
export type InsertFeelGoodPlace = z.infer<typeof insertFeelGoodPlaceSchema>;
export type DailyContent = typeof dailyContent.$inferSelect;
export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
