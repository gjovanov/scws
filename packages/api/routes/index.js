import HealthRoutes from "./health/index.js";
import MetaRoutes from "./meta/index.js";
import FileRoutes from "./file/index.js";
import AdbRoutes from "./adb/index.js";

const allRoutes = [
  ...HealthRoutes,
  ...MetaRoutes,
  ...FileRoutes,
  ...AdbRoutes,
].flatMap((r) => [r, { ...r, method: "options" }]);

export const routes = allRoutes;
