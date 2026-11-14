export type UserRole = "student" | "verifier" | "admin";
export type UserStatus = "active" | "suspended";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  year?: string;
  course?: string;
  phone?: string;
  personalEmail?: string;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
}

