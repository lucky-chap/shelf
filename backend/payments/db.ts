import { SQLDatabase } from "encore.dev/storage/sqldb";

export const paymentsDB = SQLDatabase.named("users");
