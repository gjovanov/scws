import * as uWs from "uWebSockets.js";
import { logger } from "./services/logger.js";
import { service as adbTcpService } from "./services/adb/adb-tcp-service.js";
import { Packr, Unpackr } from "msgpackr";

import Response from "./utils/http/response.js";
import Request from "./utils/http/request.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { global } from "./state/global.js";
import App from "./utils/http/app.js";
import { routes } from "./routes/index.js";
import { cors } from "./utils/http/middie/cors.js";
const __dirname = dirname(fileURLToPath(import.meta.url));

const msgpackOptions = {
	useRecords: true,
	structuredClone: true,
	bundleStrings: true,
};

const packer = new Packr(msgpackOptions);
const unpacker = new Unpackr(msgpackOptions);

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 9001;
global.users = new Map();

const run = async () => {
	const app = new App({
		host,
		port,
	});
	app.use(cors);
	for (const route of routes) {
		app.route(route, {});
	}
	app.server
		.ws("/*", {
			/* Options */
			compression: uWs.SHARED_COMPRESSOR,
			maxPayloadLength: 16 * 1024, // 16 * 1024 * 1024
			idleTimeout: 0,
			/* Handlers */
			upgrade: async (res, req, context) => {
				res.upgrade(
					{
						url: req.getUrl(),
						id: req.getQuery("id"),
						device: req.getQuery("device"),
						audio: ["true", null, undefined].includes(req.getQuery("audio")),
						audioCodec: req.getQuery("audioCodec") ?? "raw",
						audioEncoder: req.getQuery("audioEncoder") ?? undefined,

						video: ["true", null, undefined].includes(req.getQuery("video")),
						videoCodec: req.getQuery("videoCodec") ?? "h264",
						videoEncoder: req.getQuery("videoEncoder") ?? undefined,

						videoBitRate: ![null, undefined].includes(
							req.getQuery("videoBitRate"),
						)
							? Number.parseInt(req.getQuery("videoBitRate")) * 1000000
							: 4_000_000,
						displayId: ![null, undefined].includes(req.getQuery("displayId"))
							? Number.parseInt(req.getQuery("displayId"))
							: 0,
						maxSize: ![null, undefined].includes(req.getQuery("maxSize"))
							? Number.parseInt(req.getQuery("maxSize"))
							: 1280,
						maxFps: ![null, undefined].includes(req.getQuery("maxFps"))
							? Number.parseInt(req.getQuery("maxFps"))
							: 60,
					},
					/* Use our copies here */
					req.getHeader("sec-websocket-key"),
					req.getHeader("sec-websocket-protocol"),
					req.getHeader("sec-websocket-extensions"),
					context,
				);
			},
			open: async (ws) => {
				try {
					const { id, device } = ws;
					const user = {
						ws,
						client: null,
						abortController: new AbortController(),
					};
					global.users.set(id, user);

					const deviceAdb = await adbTcpService.getDeviceAdb(device);
					const { client, options } = await adbTcpService.start(
						deviceAdb,
						user,
					);
					if (!client) {
						throw new Error("No ADB TCP CLIENT");
					}
					user.client = client;

					client.stdout.pipeTo(
						new WritableStream({
							write: (line) => {
								logger.info(line);
							},
						}),
						{ signal: user.abortController?.signal || undefined },
					);

					if (options.clipboard) {
						options.clipboard
							.pipeTo(
								new WritableStream({
									write: (message) => {
										try {
											const array = packer.pack({
												media: "message",
												message,
											});
											if (user.ws) {
												const ok = user.ws?.send(array, true);
												if (ok !== 1) {
													logger.info(`WS not sent with status: ${ok}`);
												}
											}
										} catch (ex) {
											logger.error(ex);
										}
									},
								}),
								{ signal: user.abortController?.signal || undefined },
							)
							.catch((e) => {
								if (user?.abortController?.signal?.aborted) {
									return;
								}
								logger.error(e);
							});
					}

					if (client.audioStream) {
						const metadata = await client.audioStream;
						switch (metadata.type) {
							case "disabled":
								// Audio not supported by device
								logger.info("AudioStream disabled");
								break;
							case "errored":
								// Other error when initializing audio
								logger.info("AudioStream errored");
								break;
							case "success": {
								let ok;
								// Audio packets in the codec specified in options
								const audioPacketStream = metadata.stream;
								audioPacketStream
									.pipeTo(
										new WritableStream({
											write(packet) {
												try {
													const array = packer.pack({
														media: "audio",
														packet,
													});
													if (user.ws) {
														ok = user.ws?.send(array, true);
														if (!ok) logger.info("not ok", ok);
													}
												} catch (ex) {
													logger.error(ex);
												}
											},
										}),
										{ signal: user.abortController?.signal || undefined },
									)
									.catch((e) => {
										if (user?.abortController?.signal?.aborted) {
											return;
										}
										logger.error(e);
									});
								break;
							}
						}
					}

					if (client.videoStream) {
						const { metadata: videoMetadata, stream: videoPacketStream } =
							await client.videoStream;
						logger.info(videoMetadata);
						const array = packer.pack({
							media: "video_metadata",
							packet: videoMetadata,
						});
						let ok = user.ws?.send(array, true);
						if (ok !== 1) {
							logger.info(`WS not sent with status: ${ok}`);
						}

						videoPacketStream
							.pipeTo(
								new WritableStream({
									write(packet) {
										try {
											const array = packer.pack({
												media: "video",
												packet,
											});
											if (user.ws) {
												ok = user.ws?.send(array, true);
												if (ok !== 1) {
													logger.info(`WS not sent with status: ${ok}`);
												}
											}
										} catch (ex) {
											logger.error(ex);
										}
									},
								}),
								{ signal: user.abortController?.signal || undefined },
							)
							.catch((e) => {
								if (user?.abortController?.signal?.aborted) {
									return;
								}
								logger.error(e);
							});
					}
				} catch (err) {
					logger.error(err);
					ws.close();
				}
			},
			message: (ws, message) => {
				const { id } = ws;
				try {
					const user = global.users.get(id);
					if (user?.client?.controller) {
						const record = unpacker.unpack(message);
						if (record.cmd === "injectKeyCode") {
							user.client.controller.injectKeyCode(record.payload);
						} else if (record.cmd === "injectTouch") {
							user.client.controller.injectTouch(record.payload);
						} else if (record.cmd === "injectScroll") {
							user.client.controller.injectScroll(record.payload);
						} else if (record.cmd === "setScreenPowerMode") {
							user.client.controller.setScreenPowerMode(record.payload);
						} else if (record.cmd === "rotateDevice") {
							user.client.controller.rotateDevice();
						} else if (record.cmd === "setScreenPowerMode") {
							user.client.controller.setScreenPowerMode(record.payload);
						} else if (record.cmd === "clipboardPaste") {
							user.client.controller.setClipboard(record.payload);
						}
					}
				} catch (ex) {
					logger.error(ex);
				}
			},
			drain: (ws) => {
				logger.info(`WebSocket backpressure: ${ws.getBufferedAmount()}`);
			},
			close: async (ws, code, message) => {
				logger.info("WebSocket closing...");
				try {
					const { id } = ws;
					const user = global.users.get(id);
					if (user) {
						if (user.abortController) {
							try {
								// user.abortController.abort();
								user.abortController = undefined;
							} catch (err) {
								logger.error(err);
							}
						}

						user.ws = null;
						global.users.set(id, {});
						if (user.client) {
							await user.client.close();
						}
					}
				} catch (ex) {
					logger.error(ex);
				}
			},
		})
		.get("/*", (res, req) => {
			const request = new Request(res, req, {});
			const response = new Response(res, req, {}, request);

			const folder = join(__dirname, "..", "ui", "dist");
			const path = req.getUrl();
			const compress = false;
			res.cork(() => {
				res.writeHeader(
					"Access-Control-Allow-Origin",
					req.getHeader("origin") || "*",
				);
				res.writeHeader("Access-Control-Allow-Credentials", "true");
				res.writeHeader(
					"Access-Control-Allow-Headers",
					"Origin, X-Api-Key, X-Requested-With, Content-Type, Accept, Authorization",
				);
				res.writeHeader(
					"Access-Control-Allow-Methods",
					"GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
				);
				response.sendFile(
					join(folder, path === "/" ? "index.html" : path),
					true,
					compress,
				);
			});
		});
	await app.start();
};

run();
