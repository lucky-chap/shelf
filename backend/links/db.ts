import { SQLDatabase } from "encore.dev/storage/sqldb";

export const linksDB = SQLDatabase.named("users");
