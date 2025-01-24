import { controller } from "./health-controller.js";

export default [
	{
		method: "get",
		url: "/api/health/get",
		// schema: schema.get,
		handler: controller.get,
	},
];
