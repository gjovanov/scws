import { service as adbShellService } from "../../services/adb/adb-shell-service.js";
import { service as adbTcpService } from "../../services/adb/adb-tcp-service.js";
import { logger } from "../../services/logger.js";

class AdbController {
	async metainfo(res, req) {
		try {
			const result = await adbTcpService.metainfo();
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}

	async install(res, req) {
		const app = req.getQuery("app") ?? "stashcat_6893305.apk";
		const device = req.getQuery("device") ?? "localhost:6666";
		const source = req.getQuery("source") ?? "uploads";

		try {
			let result
			if (app.toLowerCase().endsWith('apkm') || app.toLowerCase().endsWith('xapk')) {
				result = await adbShellService.installMultiple(app, device, source);
			} else {
				result = await adbShellService.install(app, device, source);
			}
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}

	async start(res, req) {
		const app = req.getQuery("app") ?? "stashcat_6893305.apk";
		const device = req.getQuery("device") ?? "localhost:6666";
		const source = req.getQuery("source") ?? "uploads";

		try {
			const result = await adbShellService.start(app, device, source);
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}

	async pin(res, req) {
		const app = req.getQuery("app") ?? "stashcat_6893305.apk";
		const device = req.getQuery("device") ?? "localhost:6666";
		const source = req.getQuery("source") ?? "uploads";

		try {
			const result = await adbShellService.pin(app, device, source);
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}

	async unpin(res, req) {
		const app = req.getQuery("app") ?? "stashcat_6893305.apk";
		const device = req.getQuery("device") ?? "localhost:6666";

		try {
			const result = await adbShellService.unpin(app, device);
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}
}

export const controller = new AdbController();
