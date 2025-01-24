import { controller } from "./meta-controller.js";

export default [
	{
		method: "get",
		url: "/api/meta/get-all",
		// schema: schema.get,
		handler: controller.getAll,
	},
];
