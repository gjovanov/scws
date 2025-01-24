import { service as fileService } from "../../services/file/file-service.js";
import { logger } from "../../services/logger.js";

class FileController {
	async upload(res, req) {
		const body = await req.body;
		try {
			const result = await fileService.upload(body);
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.setStatus("500").send(ex);
		}
	}

	async getUploads(res, req) {
		try {
			const result = await fileService.getUploads();
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.send([]);
		}
	}

	async getApps(res, req) {
		try {
			const result = await fileService.getApps();
			res.send(result);
		} catch (ex) {
			logger.error(ex);
			res.send([]);
		}
	}
}

export const controller = new FileController();
