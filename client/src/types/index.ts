// Types for the Baltek Business Dashboard
// These types match the external API structure

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  bio?: string;
  avatar?: string;
  date_joined?: string;
  is_active?: boolean;
}

export interface Organization {
  id: number;
  official_name: string;
  display_name?: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  location?: string;
  employee_count?: string;
  founded_year?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salary_from?: number;
  salary_to?: number;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  employment_type: string;
  experience_level: string;
  location: string | number;
  category: string | number;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  organization: number;
  applications_count?: number;
  job_type?: string;
  workplace_type?: string;
  min_education_level?: string;
  salary_payment_type?: string;
  required_languages?: number[];
  date_started?: number;
  date_ended?: number;
  status?: string;
}

export interface CreateJob {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salary_from?: number;
  salary_to?: number;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  employment_type?: string;
  experience_level?: string;
  location: string | number;
  category: string | number;
  language?: string;
  is_active?: boolean;
  organization?: number;
  job_type?: string;
  workplace_type?: string;
  min_education_level?: string;
  salary_payment_type?: string;
  required_languages?: number[];
  date_started?: number;
  date_ended?: number;
  status?: string;
}

export interface JobApplication {
  id: number;
  job: number;
  user: number;
  cover_letter?: string;
  status: string;
  applied_at: string;
  updated_at?: string;
  user_data?: User;
  job_data?: Job;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
  country?: string;
}

export interface Language {
  id: number;
  name: string;
  code: string;
}

export interface UserExperience {
  id: number;
  company: string;
  position: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
}

export interface UserEducation {
  id: number;
  institution: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
}

export interface UserProject {
  id: number;
  title: string;
  description?: string;
  url?: string;
  start_date: string;
  end_date?: string;
}

export interface Message {
  id: number;
  room: number;
  text: string;
  owner: User;
  date_created: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface Room {
  id: number;
  name?: string;
  participants: User[];
  job?: Job;
  application?: JobApplication;
  last_message?: Message;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  description?: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export interface NotificationPreferences {
  id: number;
  user: number;
  email_notifications: boolean;
  push_notifications: boolean;
  new_applications: boolean;
  application_updates: boolean;
  new_messages: boolean;
  job_updates: boolean;
  system_alerts: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// Zod schemas for validation
import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  salary_from: z.number().optional(),
  salary_to: z.number().optional(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  currency: z.string().optional(),
  employment_type: z.string().optional(),
  experience_level: z.string().optional(),
  location: z.union([z.string(), z.number()]),
  category: z.union([z.string(), z.number()]),
  language: z.string().optional(),
  is_active: z.boolean().optional().default(true),
  organization: z.number().optional(),
  job_type: z.string().optional(),
  workplace_type: z.string().optional(),
  min_education_level: z.string().optional(),
  salary_payment_type: z.string().optional(),
  required_languages: z.array(z.number()).optional().default([]),
  date_started: z.number().optional(),
  date_ended: z.number().optional(),
  status: z.string().optional(),
});

export type CreateJobSchema = z.infer<typeof createJobSchema>;