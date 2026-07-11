const shared = require("./shared");
const { track, commandPrefix, mods } = require("../config");
const Current = require("./current");
const Command = require("./command");
const PermissionManager = require("./permission");

// Mod 管理器
// 客户端 Mod
class ClientModManager {
	// 用于存储已加载的 Mod
	static loadedMod = {};

	// 静态加载方法
	static load() {
		// 遍历 Config 中的 mods.client { Mod 名: Mod 路径 }
		Object.entries(mods.client).forEach(mod => {
			try {
				// 通过 require 加载 Mod
				const modClass = require(mod[1]);
				// 加入已加载 Mod 对象
				this.loadedMod[mod[0]] = modClass;
				// 提示
				shared.logger.info(`Client Mod ${mod[0]} 已加载`);
			} catch (e) {
				shared.logger.error(`Client Mod ${mod[0]} 加载失败`);
				if (track) shared.logger.debug(e.message);
			}
		});
	}

	// 构造函数
	constructor(client) {
		// 用于客户端定义
		this.client = client;
		// 用于存储 Mod 实例
		this.modInstances = {};
		// 用于存储 Mod 中的 Command
		this.commands = {
			normal: [],	// 除 Blocker 外可用
			user: [],	// User || OP 可用
			op: []	// OP 可用
		};

		// 实例化
		this.instantiate();

		//消息
		this.message();
	}

	// Mod 实例化
	instantiate() {
		// 遍历已加载 Mod
		Object.entries(ClientModManager.loadedMod).forEach(mod => {
			try {
				const instance = new mod[1](this.client);
				this.modInstances[mod[0]] = instance;
				this.client[mod[0]] = instance;
				// 检测 instance.commands
				if (!instance.commands || typeof instance.commands !== "function") return;

				// 通过 instance.commands 获取 cmdMap
				const cmdMap = instance.commands();
				// 遍历 cmdMap
				// 此处主要由 AI 生成
				Object.keys(cmdMap).forEach(key => {
					// 获取 list
					const cmdList = cmdMap[key];
					// 空值检查
					if (!Array.isArray(cmdList)) return;
					// 合并至 this.commands
					this.commands[key] = [...(this.commands[key] || []), ...cmdList];
			});

			} catch (e) {
				shared.logger.error(`Client Mod ${mod[0]} 实例化失败`);
				if (track) shared.logger.debug(e.message);
			}
		});
	}

	// 消息订阅 & 处理
	message() {
		// 订阅 PlayerMessage
		this.client.subscribe("PlayerMessage", async (data) => {
			// 获取相关数据
			// sender 发送者
			// msg 消息内容
			// type 消息类型 { "chat", "me", "tell", "tellraw", "title", ... }
			const sender = data.body.sender;
			const msg = data.body.message;
			const type = data.body.type;

			// 过滤非法消息（似乎作用不大？
			if (!msg || !type || !sender) return;

			this.log(sender, msg, type);

			// 过滤非 chat 消息类型或 msg 长度大于 256 的无用消息
			if (type !== "chat" || msg.length >= 256) return;

			// 过滤开头非 commandPrefix 的消息
			// commandPrefix 命令前缀
			if (!msg.startsWith(commandPrefix)) return;

			// 获取发送者的权限
			const permission = await PermissionManager.query(sender);

			// 检测错误
			if (permission instanceof Error) {
				// 输出错误
				this.client.tellAll(`Permission ${permission.message}`);
				return;
			}

			// 检测 Blocker 权限并排除
			// Blocker 黑名单人员
			if (permission === "Blocker") {
				this.client.tell(`§c命令权限错误`, sender);
				return;
			}

			// 创建 result
			let result;

			// 执行 Normal 命令
			result = this.execute(sender, msg, this.commands.normal);
			// 判断执行
			if (!result) return;

			// 仅 User 或 OP 权限人员可通过
			// User 用户
			// OP 管理
			if (permission !== "User" && permission !== "OP") {
				this.client.tell(`§c命令权限错误`, sender);
				return;
			}

			// 执行 User 命令
			result = this.execute(sender, msg, this.commands.user);
			// 判断执行
			if (!result) return;

			// 仅 OP 人员可通过
			if (permission !== "OP") {
				this.client.tell(`§c命令权限错误`, sender);
				return;
			}

			// 执行 OP 命令
			result = this.execute(sender, msg, this.commands.op);
			// 判断执行
			if (!result) return;

			// 未知命令提示
			this.client.tell(`§c未知的命令 ${msg.split(" ")[0]}`, sender);
		});
	}

	// 对于不同情况的消息类型进行不同情况的拟真输出
	log(sender, msg, type) {
		switch (type) {
			// chat
			case "chat":
				if (this.client === Current.client) shared.messageLogger.log(`<${sender}> ${msg}`);
				break;
			// 待添加...
		}
	}

	// 命令遍历执行
	execute(sender, msg, cmds) {
		try {
			// 遍历
			for (const cmd of cmds) {
				// 执行
				const result = cmd.execute(sender, msg);

				// 检测到有结果即退出
				if (result) {
					if (!result.status && result.message) this.client.tell(`§c${result.message}`, sender);
					return false;
				}
			}
		} catch (e) {
			// 报错退出
			this.client.tellAll(`§c${e.message}`);
			return false;
		}

		// 不退出
		return true;
	}

	// 静态销毁方法
	destroy() {
		// 遍历 Mod 实例
		Object.entries(this.modInstances).forEach(mod => {
			// 检查是否存在 destroy 方法
			if (mod[1].destroy && typeof mod[1].destroy === "function") {
				// 调用
				mod[1].destroy();
			}
			// 清除
			this.client[mod[0]] = null;
		});

		// 清空
		this.client = null;
		this.modInstances = {};
		this.commands = {};
	}
}

// 服务端 Mod
class ServerModManager {
	// 用于存储已加载的 Mod
	static loadedMod = {};

	// 静态加载方法
	static load() {
		// 遍历 Config 中的 mods.server { Mod 名: Mod 路径 }
		Object.entries(mods.server).forEach(mod => {
			try {
				// 通过 require 加载 Mod
				const modClass = require(mod[1]);
				this.loadedMod[mod[0]] = modClass;

				// 检查是否存在 start 方法
				if (modClass.start && typeof modClass.start === "function") {
					// 调用
					modClass.start();
				}

				// 提示
				shared.logger.info(`Server Mod ${mod[0]} 已加载`);
			} catch (e) {
				shared.logger.error(`Server Mod ${mod[0]} 加载失败`);
				if (track) shared.logger.debug(e.message);
			}
		});
	}

	// 静态销毁方法
	static destroy() {
		// 遍历已加载 Mod
		Object.entries(this.loadedMod).forEach(mod => {
			// 检查是否存在 destroy 方法
			if (mod[1].destroy && typeof mod[1].destroy === "function") {
				// 调用
				mod[1].destroy();
			}

			shared.logger.info(`Server Mod ${mod[0]} 已销毁`);
		});

		// 清空
		this.loadedMod = {};
	}
}


module.exports = { ClientModManager, ServerModManager };