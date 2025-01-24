import fs from "node:fs/promises";
import { BIN, VERSION } from "@yume-chan/fetch-scrcpy-server";
import { Adb, ADB_SYNC_MAX_PACKET_SIZE } from "@yume-chan/adb";
import {
	ReadableStream,
	Consumable,
	InspectStream,
	DistributionStream,
} from "@yume-chan/stream-extra";
import { AdbServerNodeTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { AdbServerClient } from "@yume-chan/adb";

import {
	CodecOptions,
	ScrcpyInstanceId,
	DEFAULT_SERVER_PATH,
	ScrcpyLogLevel,
	ScrcpyOptionsLatest,
	ScrcpyOptions2_3,
	ScrcpyVideoOrientation,
} from "@yume-chan/scrcpy";

import {
	AdbScrcpyClient,
	AdbScrcpyOptionsLatest,
	AdbScrcpyOptions2_1,
} from "@yume-chan/adb-scrcpy";
import { logger } from "../logger.js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { global } from "../../state/global.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

export class ProgressStream extends InspectStream {
	constructor(onProgress) {
		let progress = 0;
		super((chunk) => {
			progress += chunk.value.byteLength;
			onProgress(progress);
		});
	}
}

logger.info(`VERSION=${VERSION}`); // 2.1

global.metainfo.version = VERSION;
const server = await fs.readFile(BIN);
const connector = new AdbServerNodeTcpConnector({
	host: "localhost",
	port: 5037,
});
const serverClient = new AdbServerClient(connector);

const pushServer = async (adbInstance) => {
	await AdbScrcpyClient.pushServer(
		adbInstance,
		new ReadableStream({
			start(controller) {
				controller.enqueue(new Consumable(server));
				controller.close();
			},
		})
			.pipeThrough(new DistributionStream(ADB_SYNC_MAX_PACKET_SIZE))
			.pipeThrough(
				new ProgressStream((progress) => {
					// serverUploadedSize = progress;
				}),
			),
	);
};

class AdbTcpService {
	numOfTrials = 10;
	async getFeatures() {
		const result = await serverClient.getServerFeatures();
		return result;
	}

	async getDevices() {
		const result = await serverClient.getDevices();
		return result;
	}

	async connectToDevice(serial) {
		const transport = await serverClient.createTransport({
			serial,
		});
		const adb = new Adb(transport);

		return {
			serial,
			transport,
			adb,
			displays: [],
			encoders: [],
		};
	}

	async getDeviceDisplays(deviceAdb) {

		let result = [];
		let trial = 0;
		// retrial logic, because sometimes no displays are being retrieved
		while (!result?.length && trial < this.numOfTrials) {
			await pushServer(deviceAdb);
			result = await AdbScrcpyClient.getDisplays(
				deviceAdb,
				DEFAULT_SERVER_PATH,
				VERSION,
				new AdbScrcpyOptionsLatest(
					new ScrcpyOptionsLatest({
						logLevel: ScrcpyLogLevel.Debug,
					}),
				),
			);
			trial++;
		}
		logger.info(`getDeviceDisplays in trial=${trial}`);
		return result;
	}

	async getDeviceEncoders(deviceAdb) {
		let result = [];
		let trial = 0;
		// retrial logic, because sometimes no encoders are being retrieved
		while (!result?.length && trial < this.numOfTrials) {
			await pushServer(deviceAdb);
			result = await AdbScrcpyClient.getEncoders(
				deviceAdb,
				DEFAULT_SERVER_PATH,
				VERSION,
				new AdbScrcpyOptionsLatest(
					new ScrcpyOptionsLatest({
						logLevel: ScrcpyLogLevel.Debug,
					}),
				),
			);
			trial++;
		}
		logger.info(`getDeviceEncoders in trial=${trial}`);
		return result;
	}

	async start(deviceAdb, user) {
		const {
			audio,
			audioCodec,
			audioEncoder,
			video,
			videoCodec,
			videoEncoder,
			videoBitRate,
			displayId,
			maxSize,
			maxFps,
		} = user.ws;
		const videoCodecOptions = new CodecOptions({});
		const audioCodecOptions = new CodecOptions();

		const config = {
			audio,
			audioCodec,
			audioEncoder,
			video,
			videoCodec,
			videoEncoder,
			videoBitRate,
			displayId,
			maxSize,
			maxFps,
			logLevel: ScrcpyLogLevel.Debug,
			scid: ScrcpyInstanceId.random(),
			lockVideoOrientation: ScrcpyVideoOrientation.Unlocked,
			// sendDeviceMeta: false,
			// sendFrameMeta: false,
			// sendCodecMeta: false,
			// sendDummyByte: false,
			cleanup: true,
			tunnelForward: true,
			videoCodecOptions,
			audioCodecOptions,
		};
		const options = new AdbScrcpyOptions2_1(new ScrcpyOptions2_3(config));

		await pushServer(deviceAdb);
		const client = await AdbScrcpyClient.start(
			deviceAdb,
			DEFAULT_SERVER_PATH,
			VERSION,
			options,
		);
		return {
			client,
			options,
		};
	}

	async getDeviceAdb(deviceSerial) {
		let device = global.metainfo.devices.find((d) => d.serial === deviceSerial);
		if (!device) {
			await this.metainfo();
		}
		device = global.metainfo.devices.find((d) => d.serial === deviceSerial);
		if (!device) {
			throw new Error(
				`Device with serial = '${deviceSerial}' is not connected.`,
			);
		}
		return device.adb;
	}

	async metainfo() {
		const [features, devices] = await Promise.all([
			this.getFeatures(),
			this.getDevices(),
		]);
		const deviceModels = await Promise.all(
			devices.map((d) => this.connectToDevice(d.serial)),
		);

		await Promise.all(
			deviceModels.map(async (d) => {
				const [displays, encoders] = await Promise.all([
					this.getDeviceDisplays(d.adb),
					this.getDeviceEncoders(d.adb),
				]);
				d.displays = displays;
				d.encoders = encoders;
			}),
		);
		global.metainfo.features = features;
		global.metainfo.devices = deviceModels;

		return {
			version: global.metainfo.version,
			features: global.metainfo.features,
			devices: global.metainfo.devices.map((d) => ({
				serial: d.serial,
				displays: d.displays,
				encoders: d.encoders,
			})),
		};
	}

}

export const service = new AdbTcpService();
