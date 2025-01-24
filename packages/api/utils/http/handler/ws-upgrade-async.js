import Request from "../request.js";
import Response from "../response.js";

export const wsUpgradeAsyncHandler = (route, handler) => {
	return async (res, req, context) => {
		let response;
		let request;
		try {
			request = new Request(res, req, route);
			response = new Response(res, req, request, route);

			if (request.route.method.toLowerCase() === "options") {
				response.send();
				return;
			}
			handler(response, request, context);
		} catch (e) {
			route.logger.error(e);
			if (response && !response.aborted) {
				response.writeStatus("503").end();
			}
		}
	};
};
