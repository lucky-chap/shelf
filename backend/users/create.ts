import { api, APIError } from "encore.dev/api";
import { usersDB } from "./db";

export interface CreateUserRequest {
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  themeColor?: string;
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

// Creates a new user profile.
export const create = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    // Check if username already exists
    const existing = await usersDB.queryRow`
      SELECT id FROM users WHERE username = ${req.username}
    `;
    
    if (existing) {
      throw APIError.alreadyExists("username already taken");
    }

    const user = await usersDB.queryRow<User>`
      INSERT INTO users (username, display_name, bio, avatar_url, theme_color)
      VALUES (${req.username}, ${req.displayName}, ${req.bio || null}, ${req.avatarUrl || null}, ${req.themeColor || '#3B82F6'})
      RETURNING id, username, display_name as "displayName", bio, avatar_url as "avatarUrl", theme_color as "themeColor", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!user) {
      throw APIError.internal("failed to create user");
    }

    return user;
  }
);
