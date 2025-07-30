import { z } from "zod";

// Authentication schemas
export const loginSchema = z.object({
  phone: z.string().min(1, "Phone is required"),
  password: z.string().min(1, "Password is required"),
});

export const tokenSchema = z.object({
  access: z.string(),
  refresh: z.string(),
});

// User schemas
export const userSchema = z.object({
  id: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

// Organization schemas
export const organizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  display_name: z.string().optional(),
  description: z.string().optional(),
  about_us: z.string().optional(),
  website: z.string().url().optional(),
  location: z.object({
    id: z.number(),
    name: z.string()
  }).optional(),
  logo: z.string().optional(),
  is_public: z.boolean().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  category: z.object({
    id: z.number(),
    name: z.string()
  }).optional(),
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

// Job schemas
export const jobSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.number(),
  organization: z.number(),
  location: z.number(),
  job_type: z.enum(["full_time", "part_time", "contract"]),
  workplace_type: z.enum(["remote", "on_site", "hybrid"]),
  min_education_level: z
    .enum(["secondary", "undergraduate", "bachelor", "master", "doctorate"])
    .optional(),
  salary_from: z.number().optional(),
  salary_to: z.number().optional(),
  salary_payment_type: z
    .enum(["yearly", "monthly", "weekly", "daily", "hourly"])
    .optional(),
  required_languages: z.array(z.number()).optional(),
  status: z.enum(["open", "archived", "expired"]),
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
    status: true,
  })
  .extend({
    status: z.enum(["open", "archived", "expired"]).optional(),
  });

// User info schema for nested objects
export const userInfoSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
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
});

export const createJobApplicationSchema = jobApplicationSchema.omit({
  id: true,
  owner: true,
  room_id: true,
}).extend({
  job: z.number(),
});

// Chat schemas
export const roomSchema = z.object({
  id: z.number(),
  name: z.string(),
  participants: z.array(z.number()),
  created_at: z.string(),
  updated_at: z.string(),
  last_message: z.string().optional(),
  unread_count: z.number().optional(),
});

export const messageSchema = z.object({
  id: z.number(),
  room: z.number(),
  sender: z.number(),
  content: z.string(),
  created_at: z.string(),
  sender_name: z.string().optional(),
});

export const createMessageSchema = messageSchema.omit({
  id: true,
  created_at: true,
  sender_name: true,
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

// Insert types for compatibility
export type InsertUser = Omit<User, "id">;
