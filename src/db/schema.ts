import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  fullName: text("full_name"),
  state: jsonb("state").notNull(), // Complete UserState object
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
