"use client";

import { authClient } from "@/lib/auth-client";

export interface UserWithDetails {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  banned: boolean;
  banReason?: string;
  banExpires?: Date | null;
  accounts?: string[];
  lastSignIn?: Date | null;
  createdAt: Date;
  avatarUrl: string;
  role?: string;
}

export interface GetUsersOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: string;
  status?: string;
  email?: string;
  name?: string;
}

export async function getUsers(
  options: GetUsersOptions = {},
): Promise<{ users: UserWithDetails[]; total: number }> {
  const query: Record<string, any> = {
    limit: options.limit ?? 10,
    offset: options.offset ?? 0,
    sortBy: options.sortBy,
    sortDirection: options.sortDirection,
  };

  if (options.role) {
    query.filterField = "role";
    query.filterOperator = "eq";
    query.filterValue = options.role;
  }
  if (options.status) {
    query.filterField = "banned";
    query.filterOperator = "eq";
    query.filterValue = options.status === "banned" ? true : false;
  }
  if (options.email) {
    query.searchField = "email";
    query.searchOperator = "contains";
    query.searchValue = options.email;
  }
  if (options.name) {
    query.searchField = "name";
    query.searchOperator = "contains";
    query.searchValue = options.name;
  }

  // Debug: log current session to verify role/admin before calling admin API
  const session = await authClient.getSession();
  console.log("[auth] session", session);

  const result = await authClient.admin.listUsers({ query });

  if (!result?.data?.users) {
    return { users: [], total: 0 };
  }

  const users: UserWithDetails[] = result.data.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    verified: user.emailVerified,
    role: user.role,
    banned: user.banned ?? false,
    banReason: user.banReason || "",
    banExpires: user.banExpires || null,
    accounts: user.accounts || [],
    lastSignIn: (user as any).lastSignIn || null,
    createdAt: user.createdAt,
    avatarUrl: user.image || "",
  }));

  return { users, total: result.data.total ?? users.length };
}
