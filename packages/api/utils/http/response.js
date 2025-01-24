import fastJson from "fast-json-stringify";
import compress from "./compressor.js";
import mime from "mime-types";
import { basename } from "node:path";
import fs from "node:fs";
import * as cookie from "cookie";

const { contentType } = mime;
const { createReadStream } = fs;

const Response = function (res, req, route, request) {
	this.res = res;
	this.req = req;
	this.route = route;
	this.request = request;
	this.aborted = false;
	this._headers = new Map();
	this._cookies = new Map();
	this._status = "200";
	this.stringify = route?.schema?.response?.["200"]
		? fastJson(route.schema?.response["200"])
		: JSON.stringify;

	// query   = 00001 = 1
	// params  = 00010 = 2
	// headers = 00100 = 4
	// cookies = 01000 = 8
	// body    = 10000 = 16
	this._flags = 0; // boolean flags whether query|params|headers|cookies are initialized

	this._query = null;
	this._params = null;
	this._body = null;
	this._bodyBuffer = null;

	res.onAborted(() => {
		this.aborted = true;
	});
};

Response.prototype.getProxiedRemoteAddress = function () {
	this.res.getProxiedRemoteAddress();
	return this;
};
Response.prototype.getProxiedRemoteAddressAsText = function () {
	this.res.getProxiedRemoteAddressAsText();
	return this;
};
Response.prototype.getWriteOffset = function () {
	this.res.getWriteOffset();
	return this;
};
Response.prototype.onAborted = function (handler) {
	this.res.onAborted(handler);
	return this;
};
Response.prototype.send = function (data) {
	if (!this.aborted) {
		this.cork(() => {
			let result = data;
			if (!this.getHeader("content-type")) {
				result = this.stringify(data);
				this.setHeader("content-type", "application/json; charset=utf-8");
			}
			this.end(result);
		});
	}
	return this;
};

Response.prototype.sendFile = function (
	path,
	lastModified = true,
	compressed = false,
) {
	if (!fs.existsSync(path)) {
		this._status = 404;
		this.send(`Path '${path}' doesn't exist`);
		return;
	}
	const fileName = basename(path);
	const stat = fs.statSync(path);

	const meta = {
		fileName: basename(path),
		mimeType: contentType(fileName) || "application/octet-stream",
		stat,
		size: stat.size,
		isDir: stat.isDirectory(),
		mtime: stat.mtime,
		lastModified: stat.mtime.toUTCString(),
	};
	if (meta.isDir) {
		this._status = 404;
		this.end();
	}
	// if (lastModified) {
	// 	console.log("LAST MODIFIED");
	// 	meta.mtime.setMilliseconds(0);
	// 	if (this.request.get("if-modified-since")) {
	// 		if (new Date(this.request.get("if-modified-since")) >= meta.mtime) {
	// 			// this.writeStatus("304 Not Modified");
	// 			this._status = 304;
	// 			return this.end();
	// 		}
	// 	}
	// 	this.setHeader("last-modified", meta.lastModified);
	// }
	this.setHeader("content-type", meta.mimeType);

	// write data
	let start = 0;
	let end = 0;

	if (this.request.get("range")) {
		[start, end] = this.request
			.get("range")
			.substr(6)
			.split("-")
			.map((byte) => (byte ? Number.parseInt(byte, 10) : undefined));

		// Chrome patch for work
		if (end === undefined) {
			end = meta.size - 1;
		}

		if (start !== undefined) {
			console.log("ACCEPT RANGES");
			this._status = 206;
			// this.writeStatus("206 Partial Content");
			this.setHeader("accept-ranges", "bytes");
			this.setHeader("content-range", `bytes ${start}-${end}/${meta.size}`);
			meta.size = end - start + 1;
		}
	}
	if (end < 0) {
		end = 0;
	}

	const stream = end
		? createReadStream(path, { start, end })
		: createReadStream(path);

	let pipe;
	this.cork(() => {
		pipe = this.pipe(stream, meta.size, compressed);
		this.writeStatus(this._status);
		this.writeHeaders();
	});

	return pipe;
};

Response.prototype.pipe = function (stream, size, compressed = false) {
	this.onAborted(() => {
		if (stream) {
			stream.destroy();
		}
	});
	if (compressed) {
		const compressedStream = compress(
			stream,
			this.request.headers,
			this._headers,
		);
		if (compressedStream) {
			stream = compressedStream;
		}
	}
	if (compressed || !size) {
		stream.on("data", (buffer) => {
			if (this.aborted) {
				stream.destroy();
				return;
			}
			this.write(
				buffer.buffer.slice(
					buffer.byteOffset,
					buffer.byteOffset + buffer.byteLength,
				),
			);
		});
	} else {
		stream.on("data", (chunk) => {
			if (this.aborted) {
				stream.destroy();
				return;
			}
			const ab = chunk.buffer.slice(
				chunk.byteOffset,
				chunk.byteOffset + chunk.byteLength,
			);
			const lastOffset = this.getWriteOffset();

			// First try
			const [ok, done] = this.tryEnd(ab, size);

			if (
				done &&
				stream &&
				stream.destroy &&
				typeof stream.destroy === "function"
			) {
				stream.destroy();
			} else if (!ok) {
				// pause because backpressure
				stream.pause();

				// Register async handlers for drainage
				this.onWritable((offset) => {
					const [writeOk, writeDone] = this.tryEnd(
						ab.slice(offset - lastOffset),
						size,
					);
					if (
						writeDone &&
						stream &&
						stream.end &&
						typeof stream.end === "function"
					) {
						stream.end();
					} else if (
						writeOk &&
						stream &&
						stream.resume &&
						typeof stream.resume === "function"
					) {
						stream.resume();
					}
					return writeOk;
				});
			}
		});
	}
	stream
		.on("error", () => {
			if (!this.aborted) {
				this.writeStatus("500 Internal server error");
				this.end();
			}
			stream.destroy();
		})
		.on("end", () => {
			if (!this.aborted) {
				try {
					this.endOnly();
				} catch (e) {
					console.error(e);
				}
			}
		});

	return this;
};

Response.prototype.close = function () {
	if (!this.aborted) {
		this.aborted = true;
		return this.res.close();
	}
	return this;
};

Response.prototype.cork = function (cb) {
	if (!this.aborted) {
		return this.res.cork(cb);
	}
	return this;
};
Response.prototype.end = function (body) {
	this.writeHeaders();
	this.writeStatus(`${this._status}`);
	if (!this.aborted) {
		this.aborted = true;
		return this.res.end(body);
	}

	return this;
};
Response.prototype.endOnly = function (body) {
	if (!this.aborted) {
		this.aborted = true;
		return this.res.end(body);
	}
	console.log('uWs debugging: "end" aborted ');
	return this;
};
Response.prototype.endWithoutBody = function (
	reportedContentLength,
	closeConnection,
) {
	if (!this.aborted)
		this.res.endWithoutBody(reportedContentLength, closeConnection);
	return this;
};
Response.prototype.onData = function (handler) {
	if (!this.aborted) {
		this.res.onData(handler);
	}
	return this;
};
Response.prototype.onWritable = function (handler) {
	if (!this.aborted) {
		return this.res.onWritable(handler);
	}
	return this;
};
Response.prototype.pause = function () {
	if (!this.aborted) {
		return this.res.pause();
	}
	return this;
};
Response.prototype.resume = function () {
	if (!this.aborted) {
		return this.res.resume();
	}
};
Response.prototype.tryEnd = function (fullBodyOrChunk, totalSize) {
	if (!this.aborted) {
		return this.res.tryEnd(fullBodyOrChunk, totalSize);
	}
	return [true, true];
};
Response.prototype.upgrade = function (
	userData,
	secWebSocketKey,
	secWebSocketProtocol,
	secWebSocketExtensions,
	context,
) {
	if (!this.aborted) {
		return this.res.upgrade(
			userData,
			secWebSocketKey,
			secWebSocketProtocol,
			secWebSocketExtensions,
			context,
		);
	}
};
Response.prototype.write = function (chunk) {
	if (!this.aborted) this.res.write(chunk);
	return false;
};
Response.prototype.writeHeader = function (key, value) {
	if (!this.aborted) {
		return this.res.writeHeader(key, value);
	}
	return this;
};
Response.prototype.writeStatus = function (status) {
	if (!this.aborted) {
		return this.res.writeStatus(status);
	}
	return this;
};
Response.prototype.get = function (index) {
	return this.res[index];
};
Response.prototype.writeHeaderValues = function (header, values) {
	for (let i = 0, len = values.length; i < len; i += 1) {
		if (!this.aborted) {
			this.res.writeHeader(header, `${values[i]}`);
		}
	}
	return this;
};
Response.prototype.writeHeaders = function () {
	for (const [header, value] of this._headers) {
		if (value) {
			if (!this.aborted) {
				if (value.splice) {
					this.writeHeaderValues(header, value);
				} else {
					this.writeHeader(header, `${value}`);
				}
			}
		}
	}
	return this;
};

// HEADERS

Response.prototype.set = function (key, value) {
	const type = typeof key;
	const isObject = type === "function" || (type === "object" && !!key);
	if (isObject) {
		this.setHeaders(key);
	} else if (!!key && !!value) {
		this.setHeader(key, value);
	} else {
		throw new Error("Invalid parameters");
	}
	return this;
};

Response.prototype.append = function (key, value) {
	this.set(key, value);
	return this;
};

Response.prototype.header = function (key, value) {
	this.set(key, value);
	return this;
};

Response.prototype.getHeader = function (key) {
	return this._headers.get(key);
};

Response.prototype.setHeader = function (key, value) {
	this._headers.set(key, value);
	return this;
};

Response.prototype.removeHeader = function (key) {
	this._headers.delete(key);
	return this;
};

Response.prototype.setHeaders = function (headers) {
	for (const header in headers) {
		const headerValue = this._headers.get(header);
		if (headerValue !== undefined || headerValue !== null) {
			continue;
		}
		this.setHeader(header, headers[header]);
	}
	return this;
};

Response.prototype.hasHeader = function (key) {
	return this._headers.has(key);
};

Response.prototype.type = function (contentType) {
	this.setHeader("Content-Type", contentType);
	return this;
};

// COOKIES
Response.prototype.setCookie = function (name, value, options) {
	if (options.expires && Number.isInteger(options.expires)) {
		options.expires = new Date(options.expires);
	}
	const serialized = cookie.serialize(name, value, options);

	let setCookie = this.getHeader("set-cookie");

	if (!setCookie) {
		this.setHeader("set-cookie", serialized);
		return this;
	}

	if (typeof setCookie === "string") {
		setCookie = [setCookie];
	}

	setCookie.push(serialized);

	this.removeHeader("Set-Cookie");
	this.setHeader("Set-Cookie", setCookie);
	return this;
};

Response.prototype.cookie = function (name, value, options) {
	return this.setCookie(name, value, options);
};

Response.prototype.removeCookie = function (name, options = {}) {
	const currTime = Date.now();
	if (!options.expires || options.expires >= currTime) {
		options.expires = currTime - 1000;
	}
	this.setCookie(name, "", options);
	return this;
};

Response.prototype.clearCookie = function (name, options = {}) {
	return this.removeCookie(name, options);
};

Response.prototype.clearCookie = function (name, options = {}) {
	return this.removeCookie(name, options);
};

Response.prototype.hasCookie = function (name) {
	return this._cookies && this._cookies[name] !== undefined;
};
Response.prototype.setStatus = function (val) {
	this._status = val;
	return this;
};

Object.defineProperty(Response.prototype, "status", {
	get: function () {
		return this._status;
	},
	set: function (val) {
		this._status = val;
	},
});

export default Response;
