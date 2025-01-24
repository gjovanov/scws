const { join } = require("path");
if (
	!!process.env.NODE_ENV ||
	["development", "test"].includes(process.env.NODE_ENV)
) {
	require("dotenv").config({ path: join(__dirname, ".env") });
}

// WIN-10: Check port usage
// Get-Process -Id (Get-NetTCPConnection -LocalPort 3002).OwningProcess
module.exports = {
	apps: [
		{
			name: "scws",
			script: "index.js",
			watch: false,
			instances: "max",
			autorestart: false,
			exec_mode: "cluster",
			env: {
				HOST: "0.0.0.0",
				PORT: "4001",
			},
		},
	],
};
