// Types for the Baltek Business Dashboard
// These types match the external API structure

import { z } from "zod";

// OAuth2 will handle authentication - no local login schemas needed

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

export interface Project {
  id: number;
  organization: number;
  title: string;
  description?: string;
  link?: string;
  date_started?: string;
  date_finished?: string;
}

export interface ChatMessage {
  id: number | string;
  room: number;
  owner: number;
  text: string;
  status: "sending" | "delivered" | "failed" | "read";
  attachments: MessageAttachment[];
  date_created: number;
  isOptimistic?: boolean;
  error?: string;
  senderInfo?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
    profession?: string;
    is_online?: boolean;
  };
}

export interface MessageAttachment {
  id: number;
  file_name: string;
  file_url?: string;
  content_type?: string;
  size?: number;
}

export interface ChatRoom {
  id: number;
  content_type: string;
  object_id: number;
  content_object: any;
  unread_message_count: number;
  last_message_text: string | null;
  last_message_date_created: number | null;
}

export interface Organization {
  id: number;
  official_name: string;
  display_name?: string;
  description?: string;
  about_us?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string | number | { id: number; name: string };
  location?: string | number | { id: number; name: string };
  is_public?: boolean;
  projects?: Project[];
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
  location: string | number | { id: number; name: string };
  category: string | number | { id: number; name: string };
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  organization: number | { id: number; official_name: string };
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
  job: number | Job;
  user: number;
  owner?: User;
  cover_letter?: string;
  resume?: string;
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

export interface UserResume {
  id: number;
  user: number;
  file_url: string;
  filename: string;
  uploaded_at: string;
}

export interface RoomMessage {
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
  members?: User[];
  job?: Job;
  application?: JobApplication;
  last_message?: RoomMessage;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  description?: string;
  is_read: boolean;
  read: boolean;
  action_url?: string;
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

export const createJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required").max(1024, "Description must be 1024 characters or less"),
  requirements: z.string().max(1024, "Requirements must be 1024 characters or less").optional(),
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