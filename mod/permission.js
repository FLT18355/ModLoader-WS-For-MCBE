const PermissionManager = require("../lib/permission");
const Command = require("../lib/command");

class PermissionCommands {
	constructor(client) {
		this.client = client;
	}

	commands() {
		return {
			normal: [
				Command.create("p:q", "权限 - 快速查询")
				.setFunc(async (commander) => {
					const permission = await PermissionManager.query(commander);
					this.client.tell(`§b${permission} §f-> ${commander}`, commander);
				}),

				Command.create("p:query", "权限 - 指定查询")
				.addString("账号")
				.setFunc(async (commander, queried) => {
					const permission = await PermissionManager.query(queried);
					this.client.tell(`§b${permission} §f-> ${queried}`, commander);
				})
			],

			user: [
				Command.create("p:add", "权限 - 添加权限")
				.addString("类型")
				.addString("账号")
				.setFunc(async (_, object, value) => {
					const result = await PermissionManager.add(object, value);
					if (result instanceof Error) {
						this.client.tellAll(`§cPermission §f${result.message}`);
						return;
					}

					this.client.tellAll(`§aAdd ${object} §f-> ${value}`);
				}),

				Command.create("p:remove", "权限 - 删除权限")
				.addString("类型")
				.addString("账号")
				.setFunc(async (_, object, value) => {
					const result = await PermissionManager.add(object, value);
					if (result instanceof Error) {
						this.client.tellAll(`§cPermission §f${result.message}`);
						return;
					}

					this.client.tellAll(`§cRemove ${object} §f-> ${value}`);
				})
			]
		}
	}
}

module.exports = PermissionCommands;