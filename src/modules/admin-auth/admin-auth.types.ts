export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
