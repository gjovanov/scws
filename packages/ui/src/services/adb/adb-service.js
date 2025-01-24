import { apiClient } from "../http-client";
import * as qs from "qs";

class AdbService {
	#endpoint = "adb";

	metainfo(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/metainfo?${querystring}`;
		return apiClient.get(url);
	}

	install(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/install?${querystring}`;
		return apiClient.post(url);
	}

	start(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/start?${querystring}`;
		return apiClient.post(url);
	}

	pin(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/pin?${querystring}`;
		return apiClient.post(url);
	}

	unpin(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/unpin?${querystring}`;
		return apiClient.post(url);
	}
}

export const adbService = new AdbService();
