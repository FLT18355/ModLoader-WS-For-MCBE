// Mod
const WebSocket = require("ws");
const shared = require("./lib/shared");
const { track } = require("./config");
const Utils = require("./lib/utils");
const Current = require("./lib/current")
const { ClientModManager, ServerModManager } = require("./lib/mods");

// Start
const server = new WebSocket.Server({
	port: 19132
});
ServerModManager.load();
ClientModManager.load();
shared.logger.info("服务器已启动");

// Connection
server.on("connection", (ws) => {
	ws.utils = new Utils(ws);
	const clientMod = new ClientModManager(ws);
	ws.tellAll("§bStarWS(分支) §f已连接");

	if (!Current.client) {
		Current.client = ws;
		shared.logger.info("主客户端已连接");
	}

	ws.on("message", (message) => {
		try {
			const data = JSON.parse(String(message));
			ws.utils.onMessage(data);
		} catch {
			return;
		}
	});

	ws.on("close", () => {
		if (ws === Current.client) {
			Current.reset();
			shared.logger.info("主客户端连接已关闭");
		}

		clientMod.destroy();

		ws.removeAllListeners();
	});

	ws.on("error", (error) => {
		if (ws === Current.client) {
			shared.logger.error("主客户端错误");
			if (track) shared.logger.debug(error.message);
		}
	});
});

// Error
server.on("error", (error) => {
		shared.logger.error("服务器错误");
		if (track) shared.logger.debug(error.message);
});

// Sigint
function destroy() {
	shared.logger.info("正在关闭服务端 Mod...");
	ServerModManager.destroy();

	shared.logger.info("正在关闭服务器...");

	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			shared.logger.warning("服务器关闭失败");
			reject(new Error("服务器关闭失败"))
		}, 5000);

		server.close(() => {
			clearTimeout(timer);
			shared.logger.info("服务器已关闭");
			resolve("服务器已关闭");
		});
	});
}

process.on("SIGINT", async () => {
	if (require.main === module) {
		server.clients.forEach((client) => {
			client.tellAll("§bStarWS(分支) §f正关闭连接…");
			client.runCommand("/closewebsocket");
			client.close();
		});

		await destroy();

		shared.logger.info("程序进程结束");
		process.exit(0);
	}
});

module.exports = { destroy }