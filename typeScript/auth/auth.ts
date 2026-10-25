export type UserRole = "creator" | "recruiter";
export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
export interface LoginPayload {
  email: string;
  password: string;
}
