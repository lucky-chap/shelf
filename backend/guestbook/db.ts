import { SQLDatabase } from "encore.dev/storage/sqldb";

export const guestbookDB = SQLDatabase.named("users");
