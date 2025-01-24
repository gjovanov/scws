// Utilities
import { defineStore } from "pinia";
import { adbService as service } from "@/services/adb/adb-service";

export const useAdbStore = defineStore("adb", {
	state: () => ({
		features: [],
		devices: [],
		device: null,
		display: null,
		audioEncoder: "raw",
		videoEncoder: null,
	}),
	actions: {
		async metainfo() {
			const result = await service.metainfo();
			this.features = result?.data?.features || [];

			this.devices = result?.data?.devices || [];

			let deviceInitial;
			if (this.devices.length) {
				deviceInitial = this.devices[0];
				this.device = this.devices[0].serial;
			}
			let displayInitial;
			if (deviceInitial?.displays?.length) {
				displayInitial = deviceInitial.displays[0];
				this.display = displayInitial.id;
			}
		},
	},
	getters: {
		deviceObj() {
			return this.devices?.find((d) => d.serial === this.device);
		},
		displayObj() {
			return this.deviceObj?.displays.find((d) => d.id === this.display);
		},
		displaySize() {
			const parts = this.displayObj
				? this.displayObj.resolution.split("x")
				: ["0", "0"];
			const width = Number.parseInt(parts[0]) || 0;
			const height = Number.parseInt(parts[1]) || 0;

			return {
				width,
				height,
			};
		},
		audioEncoders() {
			return [
				{ type: "audio", id: "off", codec: "off", name: "off" },
				{ type: "audio", id: "raw", codec: "raw", name: "raw" },
				...(
					this.deviceObj?.encoders.filter((e) => e.type === "audio") || []
				).map((e) => ({ ...e, id: e.name })),
			];
		},
		audioEncoderObj() {
			return this.audioEncoders.find((e) => e.id === this.audioEncoder);
		},
		videoEncoders() {
			const encoders =
				this.deviceObj?.encoders.filter((e) => e.type === "video") || [];
			const list = [];
			for (const encoder of encoders) {
				if (encoder.codec?.toLowerCase() === "h264") {
					const tinyH264 = {
						...encoder,
						id: `TinyH264@${encoder.name}`,
						decoder: "TinyH264",
					};
					list.push(tinyH264);
					const webcodecs = {
						...encoder,
						id: `WebCodecs@${encoder.name}`,
						decoder: "WebCodecs",
					};
					list.push(webcodecs);
				} else {
					list.push({
						...encoder,
						id: `WebCodecs@${encoder.name}`,
						decoder: "WebCodecs",
					});
				}
			}
			const result = [
				{ type: "video", codec: "off", name: "off", decoder: "off" },
				...list,
			];

			const defaultVideoEncoder = result.find(
				(e) => e.codec === "h264" && e.decoder === "TinyH264",
			);
			if (defaultVideoEncoder) {
				this.videoEncoder = defaultVideoEncoder.id;
			}

			return result;
		},
		videoEncoderObj() {
			return this.videoEncoders.find((e) => e.id === this.videoEncoder);
		},
	},
});
