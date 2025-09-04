import { SQLDatabase } from "encore.dev/storage/sqldb";

export const storeDB = SQLDatabase.named("users");
