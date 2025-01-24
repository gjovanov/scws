import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsPath = join(__dirname, "..", "..", "uploads");
const appsPath = join(__dirname, "..", "..", "apps/sn-apps");

const FILE_EXTENSIONS = ['apk', 'apkm', 'xapk']

class FileService {
	async upload(body) {
		const promises = [];

		await new Promise((resolve, reject) =>
			fs.mkdir(uploadsPath, { recursive: true }, (err) => {
				if (err) {
					reject(err);
					return;
				}
				resolve("Directory created successfully:", uploadsPath);
			}),
		);

		// biome-ignore lint/complexity/noForEach: <explanation>
		Object.keys(body).forEach((key) => {
			const fileName = body[key].filename;
			const buffer = Buffer.from(body[key].data);
			const filePath = join(uploadsPath, fileName);

			const saveFile = new Promise((resolve, reject) =>
				fs.writeFile(filePath, buffer, "binary", (err) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(fileName);
				}),
			);

			promises.push(saveFile);
		});
		const result = await Promise.all(promises);
		return result;
	}

	async getUploads() {
		const result = await new Promise((resolve, reject) => {
			fs.readdir(uploadsPath, (err, files) => {
				if (err) {
					reject(err);
					return;
				}
				const result  = files.filter(f => FILE_EXTENSIONS.some(ex => f.endsWith(ex)))
				resolve(result);
			});
		});
		return result;
	}

	async getApps() {
		const result = await new Promise((resolve, reject) => {
			fs.readdir(appsPath, (err, files) => {
				if (err) {
					reject(err);
					return;
				}
				const result  = files.filter(f => FILE_EXTENSIONS.some(ex => f.endsWith(ex)))
				resolve(result);
			});
		});
		return result;
	}
}

export const service = new FileService();
