export interface AdminRole {
  id: string;
  name: string;
  slug: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: string[]; // Permission slugs, e.g. ['products.read', 'products.create']
  status?: string;
}

export interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface LoginResponseData {
  admin: AdminUser;
  accessToken: string;
}

export interface RefreshResponseData {
  accessToken: string;
}
