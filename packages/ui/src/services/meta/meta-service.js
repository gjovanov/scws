import { apiClient } from "../http-client";
import * as qs from "qs";

class MetaService {
	#endpoint = "meta";

	getAll(params) {
		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/get-all?${querystring}`;
		return apiClient.get(url);
	}
}

export const metaService = new MetaService();
