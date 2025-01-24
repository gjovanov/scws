import Request from "../request.js";
import Response from "../response.js";
import { cors } from "../middie/cors.js";

export const httpSyncHandler = (route, handler) => {
	if (route.method.toLowerCase() === "options") {
		return (res, req) => {
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
				res.writeHeader("content-type", "application/json; charset=utf8");
				res.writeStatus("200").end();
			});
		};
	}

	return (res, req) => {
		let response;
		let request;

		try {
			request = new Request(res, req, route);
			response = new Response(res, req, request, route);

			cors(response, request);

			for (const handle of handler) {
				handle(response, request);
			}
		} catch (e) {
			route.logger.error(e);
			if (response && !response.aborted) {
				response.writeStatus("503").end();
			}
		}
	};
};
