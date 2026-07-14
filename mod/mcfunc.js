const fs = require("fs");
const path = require("path");
const { basePath } = require("../config");
const Command = require("../lib/command");

//MCFunction
class MCFunc {
	constructor(client) {
		this.client = client;
		this.loops = new Map();
	}

	commands() {
		return {
			op: [
				Command.create("f:function", "Function 操作 - 运行")
				.addString("包体路径")
				.setFunc((_, path) => {
					this.run(path);
				}),

				Command.create("f:loop", "Function 操作 - 循环运行")
				.addString("包体路径")
				.addString("循环名称")
				.addFloat("间隔时间")
				.setFunc((_, path, name, interval) => {
					this.loop(path, name, interval);
				}),

				Command.create("f:stop", "Function 操作 - 停止")
				.addString("循环名称")
				.setFunc((_, name) => {
					this.stop(name);
				}),

				Command.create("f:stopAll", "Function 操作 - 停止全部")
				.setFunc((_) => {
					this.stop();
				})
			]
		};
	}

	async load(fileName) {
		try {
			const file = await fs.promises.readFile(path.join(basePath.mcfunc, fileName), "utf-8");
			const commands = file.split("\n");
			return commands;
		} catch {
			return false;
		}
	}

	async run(fileName, deep = 0, commands = null) {
		if (!commands) {
			commands = await this.load(fileName);

			if (!commands) {
				this.client.tellAll(`§f函数文件 §l§o"${fileName}" §c加载失败`);
				return;
			}

			if (deep === 0) {
				this.client.tellAll(`函数文件 §l§o"${fileName}" §r§e已运行`);
			}
		}
		

		if (deep >= 16) return;

		for (const command of commands) {
			if (command.startsWith("#")) continue;

			const parts = command.split(";");
			for (const part of parts) {
				const trimmed = part.trim();
				if (!trimmed || trimmed.startsWith("#")) continue;

				if (trimmed.startsWith("function ")) {
					await this.run(trimmed.slice("function ".length), deep + 1);
					continue;
				}

				if (trimmed.startsWith("*sleep(")) {
					const match = trimmed.match(/^\*sleep\((\d+(?:\.\d+)?)\)$/);
					if (match) {
						const seconds = parseFloat(match[1]);
						await new Promise(resolve => setTimeout(resolve, seconds * 1000));
					}
					continue;
				}

				await this.client.runCommand(trimmed);
			}
		}
	}

	async loop(fileName, loopName = null,  loopInterval = null) {
		if (!loopName) loopName = fileName;

		const commands = await this.load(fileName);

		if (!commands) {
			this.client.tellAll(`§f函数文件 §l§o"${fileName}" §c加载失败`);
			return;
		}

		if (this.loops.has(loopName)) {
			this.client.tellAll(`§f循环 §l§o"${loopName}" §r§c已存在`);
			return;
		}

		if (!loopInterval) {
			loopInterval = 50;
		} else {
			loopInterval *= 1000;
		}

		this.client.tellAll(`§f循环 §l§o"${loopName}" §r§e已开启`);

		this.loops.set(loopName, setInterval(async () => {
			await this.run(fileName, 0, commands);
		}, loopInterval));
	}

	stop(loopName = null) {
		if (loopName === null) {
			for (let loop of this.loops.values()) {
				clearInterval(loop);
			}

			this.loops.clear();
			this.client.tellAll(`§e已停止§f所有循环`);
			return;
		}

		if (this.loops.has(loopName)) {
			let loop = this.loops.get(loopName);
			clearInterval(loop);
			this.loops.delete(loopName);

			this.client.tellAll(`§f循环 §l§o"${loopName}" §r§c已关闭`);
		} else {
			this.client.tellAll(`§f循环 §l§o"${loopName}" §r§d不存在`);
		}
	}

	destroy() {
		this.stop();
		this.client = null;
	}
}

module.exports = MCFunc;