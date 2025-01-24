import utils from "./utils.js";
import { httpSyncHandler } from "./handler/http-sync.js";
import { httpAsyncHandler } from "./handler/http-async.js";
import { logger } from "../../services/logger.js";

class Route {
	constructor(options, defaults) {
		this.defaults = defaults;

		this.app = options.app;
		this.method = options.route.method;
		this.url = options.route.url;
		this.auth = options.route.auth;
        this.logger = logger;

		// handlers
		this.handler = Array.isArray(options.route.handler)
			? [...this.app.handlers, ...options.route.handler]
			: [...this.app.handlers, options.route.handler];

		this.upgrade = options.route.upgrade;
		this.open = options.route.open;
		this.message = options.route.message;
		this.drain = options.route.drain;
		this.close = options.route.close;
		this.ping = options.route.ping;
		this.pong = options.route.pong;

		this.compression = options.route.compression;
		this.idleTimeout = options.route.idleTimeout;
		this.maxPayloadLength = options.route.maxPayloadLength;

		this.schema = options.route.schema;
		this.isAsync =
			utils.areAsync(this.handler) ||
			(this.upgrade && this.upgrade.constructor.name === "AsyncFunction");

		this.params = utils.getParamNames(this.url);
		const prep = utils.prepare(this.schema, this.params);
		this._query = prep.query;
		this._params = prep.params;
		this._headers = prep.headers;
		this._cookies = prep.cookies;
		this._body = prep.body;
	}

	/**
	 * HTTP (GET/PUT/POST/DELETE/OPTIONS) handler
	 * @returns the wrapper handler
	 */
	httpHandler() {
		if (this.isAsync) {
			return httpAsyncHandler(this, this.handler);
		}
		return httpSyncHandler(this, this.handler);
	}

	/**
	 * WS handler
	 * @returns wrapper handler
	 */
	wsHandler() {
		if (this.isAsync) {
			this.upgrade = require("./handler/ws-upgrade-async")(this, this.upgrade);
		} else {
			this.upgrade = require("./handler/ws-upgrade-sync")(this, this.upgrade);
		}

		return this;
	}
}

export default Route;
