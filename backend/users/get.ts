import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";

export interface GetUserParams {
  username: string;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  themeColor: string;
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves a user by username.
export const get = api<GetUserParams, User>(
  { expose: true, method: "GET", path: "/users/:username" },
  async ({ username }) => {
    const user = await usersDB.queryRow<User>`
      SELECT id, username, display_name as "displayName", bio, avatar_url as "avatarUrl", theme_color as "themeColor", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE username = ${username}
    `;

    if (!user) {
      throw APIError.notFound("user not found");
    }

    return user;
  }
);
