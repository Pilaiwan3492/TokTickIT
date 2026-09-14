export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMIN";

export interface AuthUser {
 id: string;
 email: string;
 name: string;
 role: UserRole;
 isActive: boolean;
 mustChangePassword: boolean;
}

export interface LoginCredentials {
 email: string;
 password: string;
}

export interface ChangePasswordPayload {
 currentPassword: string;
 newPassword: string;
 confirmPassword: string;
}

export interface AuthResponse {
 data: {
 token: string;
 user: AuthUser;
 };
}

export interface ApiError {
 error: {
 code: string;
 message: string;
 fields?: Record<string, string>;
 };
}
