import { SQLDatabase } from "encore.dev/storage/sqldb";

export const usersDB = new SQLDatabase("users", {
  migrations: "./migrations",
});
