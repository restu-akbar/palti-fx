export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface Profile {
  id: string;
  member_id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  code_hash: string;
  code_hint?: string | null;
  role: UserRole;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface EduModule {
  id: string;
  title: string;
  subtitle: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan';
  icon: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  lessons?: EduLesson[];
}

export interface EduLesson {
  id: string;
  module_id: string;
  title: string;
  minutes: number;
  youtube_urls: string[];
  content: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_modules: number;
  total_lessons: number;
  active_invites: number;
  used_invites: number;
}
