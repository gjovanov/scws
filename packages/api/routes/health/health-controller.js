class HealthController {
	get(res, req) {
		res.send("ok");
	}
}

export const controller = new HealthController();
