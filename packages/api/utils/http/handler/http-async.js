import Request from "../request.js";
import Response from "../response.js";

export const httpAsyncHandler = (route, handler) => {
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

	return async (res, req) => {
		let response;
		let request;

		try {
			request = new Request(res, req, route);
			response = new Response(res, req, request, route);
			for (const handle of handler) {
				await handle(response, request);
			}
		} catch (e) {
			route.logger.error(e);
			if (response && !response.aborted) {
				response.writeStatus("503").end();
			}
		}
	};
};
