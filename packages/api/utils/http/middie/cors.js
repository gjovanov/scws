export const cors = (res, req) => {
	res.setHeader("Access-Control-Allow-Origin", req.getHeader("origin") || "*");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader(
		"Access-Control-Allow-Headers",
		"x-api-key, Origin, X-Requested-With, Content-Type, Accept, Cache-Control",
	);
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,HEAD,POST,PUT,DELETE,OPTIONS",
	);
};
