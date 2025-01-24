import { global } from "../../state/global.js";

class MetaController {
	getAll(res, req) {
		res.end(
			JSON.stringify(global.metainfo, (key, value) =>
				typeof value === "bigint" ? value.toString() : value,
			),
		);
	}
}

export const controller = new MetaController();
