export type UserStatus = 'active' | 'pending';
export type UserRole = 'member' | 'admin';

export interface User {
  id: string;
  memberId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  invitationCode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserPayload {
  id: string;
  memberId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthTokenResponse {
  token: string;
  expiresIn: string;
  user: UserPayload;
}
