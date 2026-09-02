export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  roleId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateAdminStatusInput {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ListAdminUsersQuery {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  roleId?: string;
  search?: string;
}
