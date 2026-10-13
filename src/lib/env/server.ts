import "server-only";
import { parseEnv, serverEnvSchema } from "./schema";

/** Server-side environment. Importing this from browser code fails the build. */
export const serverEnv = parseEnv(serverEnvSchema, process.env);
