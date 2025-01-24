import { v4 as uuid } from "uuid";

class StreamingService {
	ws;

	async init({
		device = undefined,
		audio = true,
		audioCodec = undefined,
		audioEncoder = undefined,
		video = true,
		videoCodec = undefined,
		videoEncoder = undefined,
		videoBitRate = undefined,
		maxFps = undefined,
		onopen = (ws, id, evt) => {},
		onclose = (ws, id, evt) => {},
		onmessage = (ws, id, evt) => {},
		onerror = (ws, id, evt) => {},
	}) {
		const id = uuid();
		this.ws = await this.initWs(
			{
				device,
				audio,
				audioCodec,
				audioEncoder,
				video,
				videoCodec,
				videoEncoder,
				videoBitRate,
				maxFps,
				onopen,
				onclose,
				onmessage,
				onerror,
			},
			id.toString(),
			"video",
		);
		return this.ws;
	}

	async initWs(
		{
			device,
			audio,
			audioCodec,
			audioEncoder,
			video,
			videoCodec,
			videoEncoder,
			videoBitRate,
			maxFps,
			onopen,
			onclose,
			onmessage,
			onerror,
		},
		id,
	) {
		const wsUri = `${import.meta.env.VITE_BACKEND_WS_URL || ""}/?id=${id}&device=${device}&audio=${audio}${audio ? `&audioCodec=${audioCodec}&audioEncoder=${audioEncoder}` : ""}&video=${video}${video ? `&videoCodec=${videoCodec}&videoEncoder=${videoEncoder}&maxFps=${maxFps}&videoBitRate=${videoBitRate}` : ""}`;
		console.log(wsUri);
		const ws = new WebSocket(wsUri);
		ws.binaryType = "arraybuffer";
		const result = await new Promise((resolve, reject) => {
			ws.onopen = (evt) => {
				try {
					onopen(ws, id, evt);
					resolve(ws);
				} catch (e) {
					console.log(e);
				}
			};
			ws.onclose = (evt) => {
				try {
					onclose(ws, id, evt);
				} catch (e) {
					console.log(e);
				}
			};
			ws.onmessage = (evt) => {
				onmessage(ws, id, evt);
			};
			ws.onerror = (evt) => {
				try {
					onerror(ws, id, evt);
				} catch (e) {
					console.log(e);
				}
			};
		});
		return result;
	}
}

export const streamingService = new StreamingService();
