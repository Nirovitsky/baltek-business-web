import { z } from "zod";

// Authentication schemas
export const loginSchema = z.object({
  phone: z.string()
    .min(8, "Phone number must be 8 digits")
    .max(8, "Phone number must be 8 digits")
    .regex(/^\d{8}$/, "Phone number must contain only digits"),
  password: z.string().min(1, "Password is required"),
});

export const tokenSchema = z.object({
  access: z.string(),
  refresh: z.string(),
});

// User Experience schema
export const userExperienceSchema = z.object({
  id: z.number(),
  organization: z.number().optional(),
  organization_name: z.string(),
  position: z.string(),
  description: z.string(),
  date_started: z.string(),
  date_finished: z.string().nullable().optional(),
});

// User Education schema
export const userEducationSchema = z.object({
  id: z.number(),
  university: z.union([
    z.number(),
    z.object({
      id: z.number(),
      name: z.string(),
      location: z.object({
        id: z.number(),
        name: z.string(),
      }).optional(),
    }),
  ]),
  level: z.enum(["secondary", "undergraduate", "bachelor", "master", "doctorate"]),
  date_started: z.string().nullable().optional(),
  date_finished: z.string().nullable().optional(),
});

// User Project schema
export const userProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  link: z.string().optional(),
  date_started: z.string(),
  date_finished: z.string().nullable().optional(),
});

// User Resume schema
export const userResumeSchema = z.object({
  id: z.number(),
  title: z.string(),
  file: z.string().nullable().optional(),
  date_created: z.string(),
});

// User schemas
export const userSchema = z.object({
  id: z.number(),
  phone: z.string(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  profession: z.string().optional(),
  gender: z.enum(["m", "f"]).optional(),
  avatar: z.string().optional(),
  location: z.number().optional(),
  date_of_birth: z.string().nullable().optional(),
  experiences: z.array(userExperienceSchema).optional(),
  educations: z.array(userEducationSchema).optional(),
  projects: z.array(userProjectSchema).optional(),
  resumes: z.array(userResumeSchema).optional(),
  is_jobs_onboarding_completed: z.boolean().optional(),
  is_organizations_onboarding_completed: z.boolean().optional(),
  is_online: z.boolean().optional(),
});

// Organization schemas
export const organizationSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  official_name: z.string(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  about_us: z.string().optional(),
  website: z.string().url().optional(),
  location: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  logo: z.string().optional(),
  is_public: z.boolean().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  category: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const organizationProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  organization: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Location and Category schemas
export const locationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

export const languageSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
});

// Job schemas - updated to match actual backend response
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  requirements: z.string().optional(),
  category: z.union([
    z.number(),
    z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional(),
    })
  ]),
  organization: z.union([
    z.number(),
    z.object({
      id: z.number(),
      official_name: z.string(),
      display_name: z.string().optional(),
      logo: z.string().optional(),
    })
  ]),
  location: z.union([
    z.number(),
    z.object({
      id: z.number(),
      name: z.string(),
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
    })
  ]),
  job_type: z.enum(["full_time", "part_time", "contract"]),
  workplace_type: z.enum(["remote", "on_site", "hybrid"]),
  min_education_level: z
    .enum(["secondary", "undergraduate", "bachelor", "master", "doctorate"])
    .optional(),
  salary_from: z.number(),
  salary_to: z.number().optional(),
  salary_payment_type: z
    .enum(["yearly", "monthly", "weekly", "daily", "hourly"])
    .optional(),
  currency: z.string().optional(),
  required_languages: z.array(z.number()).optional(),
  status: z.enum(["open", "archived", "expired"]),
  date_started: z.string(),
  date_ended: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  applications_count: z.number().optional(),
});

export const createJobSchema = jobSchema
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
    applications_count: true,
  })
  .extend({
    min_education_level: z.enum(["secondary", "undergraduate", "bachelor", "master", "doctorate"]).optional(),
    salary_to: z.number().optional(),
  });

// User info schema for nested objects
export const userInfoSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  profession: z.string().optional(),
  avatar: z.string().optional(),
  is_online: z.boolean().optional(),
});

// Job list schema for nested objects
export const jobListSchema = z.object({
  id: z.number(),
  title: z.string(),
  organization: z.object({
    id: z.number(),
    name: z.string(),
  }),
  location: locationSchema,
});

// Job Application schemas
export const jobApplicationSchema = z.object({
  id: z.number(),
  job: jobListSchema,
  owner: userInfoSchema,
  status: z.enum(["pending", "invited", "rejected", "hired", "expired"]),
  cover_letter: z.string().optional(),
  resume: z.string().optional(),
  room_id: z.number().nullable().optional(),
  date_applied: z.string().optional(),
  created_at: z.string().optional(),
});

export const createJobApplicationSchema = jobApplicationSchema
  .omit({
    id: true,
    owner: true,
    room_id: true,
  })
  .extend({
    job: z.number(),
  });

// Chat schemas - corrected to match actual API response
export const roomSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  members: z.array(z.number()), // API returns array of user IDs, not user objects
  last_message_text: z.string().optional(),
  last_message_date_created: z.string().optional(),
  unread_message_count: z.number().optional(),
  content_type: z.number().optional(),
  object_id: z.number().optional(),
});

export const messageSchema = z.object({
  id: z.number(),
  room: z.number(),
  owner: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    profession: z.string().optional(),
    avatar: z.string().optional(),
    is_online: z.boolean().optional(),
  }),
  text: z.string().optional(),
  status: z.string().optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
  attachment_type: z.string().optional(),
  attachment_size: z.number().optional(),
  date_created: z.string(),
});

export const createMessageSchema = z.object({
  room: z.number(),
  text: z.string().optional(),
  attachment_url: z.string().optional(),
  attachment_name: z.string().optional(),
  attachment_type: z.string().optional(),
  attachment_size: z.number().optional(),
});

// Bookmark and Filter schemas
export const bookmarkSchema = z.object({
  id: z.number(),
  job: z.number(),
  user: z.number(),
  created_at: z.string(),
});

export const savedFilterSchema = z.object({
  id: z.number(),
  name: z.string(),
  filters: z.record(z.any()),
  user: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Pagination schemas
export const paginatedSchema = <T extends z.ZodType<any>>(itemSchema: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });

// Type exports
export type LoginRequest = z.infer<typeof loginSchema>;
export type TokenResponse = z.infer<typeof tokenSchema>;
export type UserExperience = z.infer<typeof userExperienceSchema>;
export type UserEducation = z.infer<typeof userEducationSchema>;
export type UserProject = z.infer<typeof userProjectSchema>;
export type UserResume = z.infer<typeof userResumeSchema>;
export type User = z.infer<typeof userSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type OrganizationProject = z.infer<typeof organizationProjectSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Language = z.infer<typeof languageSchema>;
export type Job = z.infer<typeof jobSchema>;
export type CreateJob = z.infer<typeof createJobSchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type CreateJobApplication = z.infer<typeof createJobApplicationSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Message = z.infer<typeof messageSchema>;
export type CreateMessage = z.infer<typeof createMessageSchema>;
export type Bookmark = z.infer<typeof bookmarkSchema>;
export type SavedFilter = z.infer<typeof savedFilterSchema>;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Database schemas for PostgreSQL implementation
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  boolean,
} from "drizzle-orm/pg-core";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  phone: varchar("phone").unique().notNull(),
  email: varchar("email"),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Chat rooms table
export const rooms = pgTable("rooms", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Room members table
export const roomMembers = pgTable("room_members", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  room_id: integer("room_id").references(() => rooms.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  joined_at: timestamp("joined_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  room_id: integer("room_id").references(() => rooms.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  text: text("text"),
  attachment_url: varchar("attachment_url"),
  attachment_name: varchar("attachment_name"),
  attachment_type: varchar("attachment_type"), // 'image', 'document', 'video', etc.
  attachment_size: integer("attachment_size"), // in bytes
  created_at: timestamp("created_at").defaultNow(),
});

// Drizzle relations
import { relations } from "drizzle-orm";

export const roomsRelations = relations(rooms, ({ many }) => ({
  members: many(roomMembers),
  messages: many(messages),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomMembers.room_id],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.user_id],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.room_id],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [messages.user_id],
    references: [users.id],
  }),
}));

// Insert types for compatibility
export type InsertUser = Omit<User, "id">;
export type DbUser = typeof users.$inferSelect;
export type DbRoom = typeof rooms.$inferSelect;
export type DbMessage = typeof messages.$inferSelect;
