import { logger } from "../../services/logger.js";
import * as uws from "uWebSockets.js";
import Route from "./route.js";

import readline from "node:readline";

class App {
	constructor(config = {}) {
		this.uws = uws;
		this.getParts = uws.getParts;
		this.config = config;
		this.protocol = "http"; // ommited https config
		this.host = config.host || "0.0.0.0";
		this.port = Number.parseInt(config.port || 4001);
		this.server = this.protocol === "https" ? uws.SSLApp(config) : uws.App();

		this.logger = logger;
		this.token = null; // us_listen_socket
		this.hooks = new Map([["onclose", new Set()]]);
		this.handlers = new Set();
		this.routes = new Set();
		this.plugins = new Map();

		// initialize routes
		const routes = config.routes || [];
		if (routes?.length) {
			// biome-ignore lint/complexity/noForEach: <explanation>
			routes.forEach((route) => {
				this.route(route);
			});
		}
	}

	/**
	 * Register new route
	 * @param {New route options} r
	 */
	route(r, defaults) {
		const route = new Route(
			{
				app: this,
				route: r,
				logger: this.logger,
			},
			defaults,
		);
		if (!route.method) {
			throw new Error("Route must have method");
		}
		if (route.method.toLowerCase() !== "ws") {
			if (!route.url || !route.handler) {
				throw new Error("Route must have method, url and handler defined!");
			}
		}

		this.routes.add(route);
		const handler =
			route.method.toLowerCase() === "ws"
				? route.wsHandler()
				: route.httpHandler();
		this.server[route.method.toLowerCase()](route.url, handler);
		return this;
	}

	/**
	 * Register new plugin
	 * @param {new addon/plugin} addon
	 */
	async plugin(addon) {
		await addon(this);
		return this;
	}

	/**
	 * Add new event handler
	 * @param {name of the event} name
	 * @param {callback as event handler} cb
	 */
	on(name, cb) {
		if (!this.hooks.get(name)) {
			throw new Error("Non-supported hook");
		}
		this.hooks.get(name).add(cb);
		return this;
	}

	/**
	 * Extends the App scope with property
	 * @param {name of the new propery} name
	 * @param {value of the new property} val
	 */
	add(name, val) {
		if (!App.prototype.$) {
			App.prototype.$ = (name) => this.plugins.get(name);
		}
		if (!App.prototype[`$${name}`]) {
			Object.defineProperty(App.prototype, `$${name}`, {
				get: () => this.plugins.get(name),
			});
		}

		this.plugins.set(name, val);
		this.logger.info(`New App scope: '${name}' was added to global '$' scope`);
		return this;
	}

	use(middleware) {
		this.handlers.add(middleware);
		return this;
	}

	/**
	 * Server starts listening on: host:port
	 */
	start() {
		return new Promise((resolve, reject) => {
			this.server.listen(this.port, (token) => {
				let message;
				if (!token) {
					message = `Server faild to start listening on: ${this.host}:${this.port} ❌`;
					this.logger.info(message);
					reject(new Error(message));
				} else {
					this.token = token;
					message = `Server is listening on: ${this.host}:${this.port} 🔥`;
					this.logger.info(message);
					// this.shutdownHandler();
					resolve(token);
				}
			});
		});
	}

	shutdownHandler() {
		if (process.platform === "win32") {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl.on("SIGINT", () => {
				this.logger.info("SIGINT");
				process.emit("SIGINT");
			});
			rl.on("SIGTERM", () => {
				this.logger.info("SIGTERM");
				process.emit("SIGTERM");
			});
			rl.on("SIGUSR2", () => {
				this.logger.info("SIGUSR2");
				process.emit("SIGUSR2");
			});
		}
		const signals = [
			"beforeExit",
			"uncaughtException",
			"unhandledRejection",
			"SIGHUP",
			"SIGINT",
			"SIGQUIT",
			"SIGILL",
			"SIGTRAP",
			"SIGABRT",
			"SIGBUS",
			"SIGFPE",
			"SIGUSR1",
			"SIGSEGV",
			"SIGUSR2",
			"SIGTERM",
		];
		// biome-ignore lint/complexity/noForEach: <explanation>
		signals.forEach((evt) =>
			process.on(evt, async (evtOrExitCodeOrError) => {
				try {
					await this.stop();
				} catch (e) {
					this.logger.error("EXIT HANDLER ERROR", e);
				}
				this.logger.info("Graceful shutdown was successful");
				process.exit(
					Number.isNaN(+evtOrExitCodeOrError) ? 0 : +evtOrExitCodeOrError,
				);
			}),
		);
		process.on("message", async (msg) => {
			if (msg === "shutdown") {
				try {
					await this.stop();
				} catch (e) {
					this.logger.error("EXIT HANDLER ERROR", e);
				}
				this.logger.info("Graceful shutdown was successful");
				process.exit(0);
			}
		});
	}

	/**
	 * Server stops listening
	 */
	async stop() {
		if (this.uws) {
			this.logger.info("Server is stopping...");
			const hooks = this.hooks.get("onclose");
			try {
				await Promise.all([...hooks].map((h) => h()));
				if (this.token) {
					this.uws.us_listen_socket_close(this.token);
					this.token = null;
				}
			} catch (e) {
				this.logger.error(e);
			}
		}

		this.logger.info("Server was stopped.");
	}
}

export default App;
