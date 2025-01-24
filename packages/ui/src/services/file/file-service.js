import { apiClient } from "../http-client";
import { useProgressStore } from "@/store/progress";
 import * as qs from "qs";

class FileUploadService {
	#endpoint = "file";

	upload(files, params) {
		const progressStore = useProgressStore();
		const formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			formData.append(`files[${i}]`, file);
		}

		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/upload?${querystring}`;
		return apiClient.post(url, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
			onUploadProgress: ({ loaded, total }) => {
				progressStore.setProgress(Math.floor((loaded * 100) / total));
			},
		});
	}

	  getUplaods(params) {
 		const querystring = qs.stringify(params, { encode: false });
		const url = `/${this.#endpoint}/get-uploads?${querystring}`;
		return apiClient.get(url);
	
 	}

	 getApps(params) {
		const querystring = qs.stringify(params, { encode: false });
	   const url = `/${this.#endpoint}/get-apps?${querystring}`;
	   return apiClient.get(url);
   
	}
}

export const fileUploadService = new FileUploadService();
