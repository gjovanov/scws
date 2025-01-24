import { createBrotliCompress, createDeflate, createGzip } from "node:zlib";
const priority = ["br", "gzip", "deflate"];

export default (stream, reqHeaders, resHeaders) => {
	const contentEncoding = reqHeaders["accept-encoding"];

	const encoding = priority.find(
		(encodingItem) =>
			contentEncoding && contentEncoding.indexOf(encodingItem) !== -1,
	);

	const compression =
		encoding === "br"
			? createBrotliCompress()
			: encoding === "gzip"
				? createGzip()
				: encoding === "deflate"
					? createDeflate()
					: null;

	if (compression) {
		resHeaders.set("Content-Encoding", encoding);
		return stream.pipe(compression);
	}
	return null;
};
