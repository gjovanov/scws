import { join } from "node:path";
import { spawn } from "node:child_process";
import { logger } from "../logger.js";
import { v4 as uuid } from "uuid";
import {
  getAppPath,
  UPLOAD_DIR,
  APPS_DIR,
  SCRIPTS_DIR,
  TMP_DIR,
} from "./getAppPath.js";

class AdbShellService {
  async install(app = "de.heinekingmedia.stashcat.apk", device = null, source) {
    const installArgs = device ? ["-s", device] : [];
    const appPath = getAppPath(source, app);
    const commandArgs = [...installArgs, "install", appPath];
    console.log("COMMAND ARGS =", commandArgs);

    const log = {
      logs: [],
      errors: [],
      finished: false,
    };
    const result = await new Promise((resolve, reject) => {
      const child = spawn("adb", commandArgs);
      child.stdout.on("data", (data) => {
        const msg = data.toString();
        log.logs.push(msg);
      });
      child.stderr.on("data", (data) => {
        const msg = data.toString();
        logger.error(msg);
        log.errors.push(msg);
        reject(log);
      });
      child.on("exit", () => {
        logger.info("INSTALL FINISHED!");
        log.finished = true;
        resolve(log);
      });
    });
    return result;
  }

  async installMultiple(
    app = "de.heinekingmedia.stashcat.apkm",
    device = null,
    source
  ) {
    const temp = uuid().toString();
    const parts = app.split(".");
    const appPath = source === "uploads" ? UPLOAD_DIR : APPS_DIR;
    let extension;
    let filename;
    if (parts?.length) {
      extension = parts[parts.length - 1];
      filename = parts.slice(0, -1).join(".");
    }

    const deviceArg = device ? `-s ${device}` : "";

    // unzip
    // adb -s device install-multiple *.apk
    const commandArgs = [
      join(SCRIPTS_DIR, "adb-extract-and-install-multiple.sh"),
      appPath,
      filename,
      extension,
      join(TMP_DIR, temp),
      deviceArg,
    ];
    const log = {
      logs: [],
      errors: [],
      finished: false,
    };
    const result = await new Promise((resolve, reject) => {
      const child = spawn("bash", commandArgs);
      child.stdout.on("data", (data) => {
        const msg = data.toString();
        log.logs.push(msg);
      });
      child.stderr.on("data", (data) => {
        const msg = data.toString();
        logger.error(msg);
        log.errors.push(msg);
        reject(log);
      });
      child.on("exit", () => {
        logger.info("INSTALL BUNDLE FINISHED!");
        log.finished = true;
        resolve(log);
      });
    });

    return result;
  }

  async start(app = "de.heinekingmedia.stashcat.apk", device = null, source) {
    const deviceArg = device ? `-s ${device}` : "";
    const appPath = getAppPath(source, app);
    // adb shell am start-activity --user 0 de.heinekingmedia.stashcat/.start.StartActivity
    const commandArgs = [
      join(SCRIPTS_DIR, "aapt2-extract-and-start-activity.sh"),
      appPath,
      deviceArg,
    ];
    const log = {
      logs: [],
      errors: [],
      finished: false,
    };
    const result = await new Promise((resolve, reject) => {
      const child = spawn("bash", commandArgs);
      child.stdout.on("data", (data) => {
        const msg = data.toString();
        log.logs.push(msg);
      });
      child.stderr.on("data", (data) => {
        const msg = data.toString();
        logger.error(msg);
        log.errors.push(msg);
        reject(log);
      });
      child.on("exit", () => {
        logger.info("START FINISHED!");
        log.finished = true;
        resolve(log);
      });
    });

    return result;
  }

  async pin(app = "de.heinekingmedia.stashcat.apk", device = null, source) {
    const deviceArg = device ? `-s ${device}` : "";
    const appPath = getAppPath(source, app);
    // adb shell am task lock $(adb shell dumpsys activity recents | grep "Recent #.*de\.heinekingmedia\.stashcat" | cut -d '#' -f 3 | cut -d ' ' -f 1)
    const commandArgs = [
      join(SCRIPTS_DIR, "aapt2-extract-and-pin.sh"),
      appPath,
      deviceArg,
    ];
    const log = {
      logs: [],
      errors: [],
      finished: false,
    };
    const result = await new Promise((resolve, reject) => {
      const child = spawn("bash", commandArgs);
      child.stdout.on("data", (data) => {
        const msg = data.toString();
        log.logs.push(msg);
      });
      child.stderr.on("data", (data) => {
        const msg = data.toString();
        logger.error(msg);
        log.errors.push(msg);
        reject(log);
      });
      child.on("exit", () => {
        logger.error("PIN FINISHED!");
        log.finished = true;
        resolve(log);
      });
    });

    return result;
  }

  async unpin(app = "de.heinekingmedia.stashcat.apk", device = null) {
    const startArgs = device ? ["-s", device] : [];
    // adb shell am task lock stop
    const commandArgs = [...startArgs, "shell", "am", "task", "lock", "stop"];
    const log = {
      logs: [],
      errors: [],
      finished: false,
    };
    const result = await new Promise((resolve, reject) => {
      const child = spawn("adb", commandArgs);
      child.stdout.on("data", (data) => {
        const msg = data.toString();
        log.logs.push(msg);
      });
      child.stderr.on("data", (data) => {
        const msg = data.toString();
        logger.error(msg);
        log.errors.push(msg);
        reject(log);
      });
      child.on("exit", () => {
        logger.info("UNPIN FINISHED!");
        log.finished = true;
        resolve(log);
      });
    });
    return result;
  }
}

export const service = new AdbShellService();
