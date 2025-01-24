import { controller } from "./adb-controller.js";

export default [
	{
		method: "get",
		url: "/api/adb/metainfo",
		// schema: schema.get,
		handler: controller.metainfo,
	},
	{
		method: "post",
		url: "/api/adb/install",
		// schema: schema.get,
		handler: controller.install,
	},
	{
		method: "post",
		url: "/api/adb/start",
		// schema: schema.get,
		handler: controller.start,
	},
	{
		method: "post",
		url: "/api/adb/pin",
		// schema: schema.get,
		handler: controller.pin,
	},
	{
		method: "post",
		url: "/api/adb/unpin",
		// schema: schema.get,
		handler: controller.unpin,
	},
];
