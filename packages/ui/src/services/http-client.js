import axios from "axios";
import { accessToken } from "@/utils/constants";
import { storage } from "./storage";

// axios.defaults.withCredentials = true
const token = storage.getLocal(accessToken) || undefined;
export const apiClient = axios.create({
	baseURL: `${import.meta.env.VITE_BACKEND_URL || ""}/api`,
	// withCredentials: false,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
		Authorization: token,
	},
});

apiClient.interceptors.request.use(
	async (config) => {
		const token = storage.getLocal(accessToken) || undefined;
		config.headers.Authorization = token;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// // defining a custom error handler for all APIs
// const errorHandler = (error) => {
//     const statusCode = error.response?.status

//     // logging only errors that are not 401
//     if (statusCode && statusCode !== 401) {
//         console.error(error)
//     }

//     if (statusCode && statusCode === 401) {
//         console.error('User is not authenticated.')
//         location.href = '/Auth/Register'
//     }

//     return Promise.reject(error)
// }

// // registering the custom error handler to the
// // "api" axios instance
// apiClient.interceptors.response.use(undefined, (error) => {
//     return errorHandler(error)
// })

// apiClient.interceptors.response.use()
