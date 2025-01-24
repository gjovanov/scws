import pino from "pino";

const isDevOrTest = ['development', 'test'].includes(process.env.NODE_ENV)
export const logger = pino(
	{
		name: "scws",
		level: isDevOrTest ? "info" : "error",
		transport: isDevOrTest
			? {
					target: "pino-pretty",
				}
			: undefined,
	},
	pino.destination(),
);
