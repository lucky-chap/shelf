import { SQLDatabase } from "encore.dev/storage/sqldb";

export const siteDB = SQLDatabase.named("users");
