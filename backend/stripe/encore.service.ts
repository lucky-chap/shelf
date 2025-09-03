import { Service } from "encore.dev/service";
// Perform startup checks and logging for Stripe configuration.
import "./startup";

export default new Service("stripe");
