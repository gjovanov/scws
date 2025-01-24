import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));

export const APPS_DIR = join(__dirname, "..", "..", "apps/sn-apps");
export const UPLOAD_DIR = join(__dirname, "..", "..", "uploads");
export const SCRIPTS_DIR = join(__dirname, "..", "..", "scripts");
export const TMP_DIR = join(__dirname, "..", "..", "..", "..", "tmp");

export function getAppPath(source, app) {
  return source === "uploads" ? join(UPLOAD_DIR, app) : join(APPS_DIR, app);
}
