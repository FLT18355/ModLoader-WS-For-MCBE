const path = require("path");
const modBasePath = "../mod/";

class ModLoader {
	constructor(client) {
		this.client = client;
		this.mods = new Map();
		console.log("ModLoader Summon");

		try {
			const { manage } = require("../manager");
			manage(this);
			console.log("调用");
		} catch (error) {
			console.log(error);
			null;
		}
	}

	add(fileName, name = null, run = false) {
		let modName = name || fileName;

		if (this.mods.has(modName)) return {
			success: false,
			message: "Mod 已存在"
		};

		try {
			const modPath = require.resolve(path.join(modBasePath, fileName));
			if (require.cache[modPath]) delete require.cache[modPath];

			const modClass = require(path.join(modBasePath, fileName));
			const modInstance = new modClass(this.client);

			this.mods.set(modName, {
				name: modName,
				instance: modInstance,
				path: modPath,
				running: false
			});
		} catch (error) {
			return {
				success: false,
				message: `添加失败: ${error.message}`
			};
		}

		if (run) {
			return this.run(modName, false);
		}

		return {
			success: true,
			message: `${modName} 添加成功`
		};
	}

	check(modName) {
		if (!this.mods.has(modName)) {
			return {
				success: false,
				message: "Mod 不存在"
			};
		}

		return {
			success: true,
			message: `${modName} 存在`
		};
	}

	remove(modName, check = true, reason = null) {
		if (check) {
			const checkResult = this.check(modName);
			if (!checkResult.success) return checkResult;
		}

		const modData = this.mods.get(modName);
		if (modData.running === true) this.stop(modName, false);

		if (typeof modData.instance.onRemove === "function") {
			try {
				modData.instance.onRemove(reason);
			} catch {
				null;
			}
		}

		this.mods.delete(modName);

		if (modData.path && require.cache[modData.path]) delete require.cache[modData.path];

		return {
			success: true,
			message: `${modName} 删除成功`
		};
	}

	run(modName, check = true) {
		if (check) {
			const checkResult = this.check(modName);
			if (!checkResult.success) return checkResult;
		}

		const modData = this.mods.get(modName);

		if (modData.running) return {
			success: false,
			message: `${modName} 已在运行`
		};

		if (typeof modData.instance.onRun !== "function") {
			return {
				success: false,
				message: `${modName} 不支持运行`
			};
		}

		try {
			modData.instance.onRun();
		} catch {
			return {
				success: false,
				message: `${modName} 运行失败`
			};
		}

		modData.running = true;

		return {
			success: true,
			message: `${modName} 已运行`
		};
	}

	stop(modName, check = true, must = false) {
		if (check) {
			const checkResult = this.check(modName);
			if (!checkResult.success) return checkResult;
		}

		const modData = this.mods.get(modName);

		if (!modData.running) return {
			success: false,
			message: `${modName} 未运行`
		};

		if (!must && typeof modData.instance.onStop !== "function") {
			return {
				success: false,
				message: `${modName} 不支持停止`
			};
		}

		try {
			modData.instance.onStop();
		} catch {
			if (!must) return {
				success: false,
				message: `${modName} 停止失败`
			};
		}

		modData.running = false;

		return {
			success: true,
			message: `${modName} 已停止`
		};
	}

	removeAll(reason = null) {
		const modNames = Array.from(this.mods.keys());

		for (const modName of modNames) {
			this.remove(modName, false, reason);
		}
	}

	runAll() {
		const modNames = Array.from(this.mods.keys());

		for (const modName of modNames) {
			this.run(modName, false);
		}
	}

	stopAll() {
		const modNames = Array.from(this.mods.keys());

		for (const modName of modNames) {
			this.stop(modName, false);
		}
	}

	onMessage(data) {
		let json;

		try {
			json = data.toString("utf-8");
		} catch (error) {
			null;
		}

		if (json === "[object Undefined]" || !json) return;

		let msg;
		try {
			msg = JSON.parse(json);
		} catch (error) {
			return;
		}

		for (const modData of this.mods.values()) {
			if (modData.running) {
				if (typeof modData.instance.onMessage !== "function") return;

				try {
					modData.instance.onMessage(msg);
				} catch {
					null;
				}
			}
		}
	}

	onClose() {
		this.destroy("close");
	}

	onError(error) {
		this.destroy(error);
	}

	destroy(reason) {
		this.removeAll(reason);

		this.mods.clear();
		this.client = null;
	}
}

module.exports = { ModLoader };