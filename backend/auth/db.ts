import { SQLDatabase } from "encore.dev/storage/sqldb";

export const authDB = SQLDatabase.named("users");
