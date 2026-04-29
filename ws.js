// Mod
const WebSocket = require("ws");
const { ModLoader } = require("./lib/modloader");

// Start
const server = new WebSocket.Server({
	port: 8080
});
console.log("< 服务器已启动");

// Connection
server.on("connection", (ws) => {
	ws.modloader = new ModLoader(ws);

	ws.on("message", (message) => {
		ws.modloader.onMessage(message);
	});

	ws.on("close", () => {
		ws.modloader.onClose();
		ws.removeAllListeners();
	});

	ws.on("error", (error) => {
		ws.modloader.onError(error);
	});
});

// Error
server.on("error", (error) => {
	console.log(error);
});

// Sigint
process.on("SIGINT", async () => {
	server.clients.forEach((client) => {
		client.terminate();
	});

	const serverClose = new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error("Failed To Close WebSocket"))
		}, 5000);

		server.close(() => {
			clearTimeout(timer);
			resolve("Success To Close");
		});
	});

	console.log("< 服务器已关闭");
	process.exit(0);
});