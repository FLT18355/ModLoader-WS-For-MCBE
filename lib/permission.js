const fs = require("fs").promises;

// 权限管理类
// 基于 JSON 文件的权限系统，支持 blocker/user/op 三级权限的增删查改
class PermissionManager {
	// 读取权限配置
	// object: "all" 返回完整配置，"blocker"/"user"/"op" 返回对应列表
	static async get(object = "all") {
		const content = await fs.readFile("./permission.json", "utf-8");
		const permissions = JSON.parse(content);

		if (object === "all") return permissions;

		if (!["blocker", "user", "op"].includes(object)) {
			throw new Error("非法对象");
		}

		return permissions[object];
	}

	// 写入完整权限配置
	static async set(newPer) {
		try {
			await fs.writeFile("./permission.json", JSON.stringify(newPer, null, 2));
			return true;
		} catch (error) {
			return error;
		}
	}

	// 向指定权限组添加成员
	// object: 权限组名称（blocker/user/op）
	// value: 要添加的成员标识
	static async add(object, value) {
		try {
			if (!["blocker", "user", "op"].includes(object)) {
				throw new Error("非法对象");
			}

			const Per = await PermissionManager.get();

			// 确保目标组为数组
			if (!Array.isArray(Per[object])) {
				Per[object] = [];
			}

			// 已存在则直接返回
			if (Per[object].includes(value)) {
				return true;
			}

			Per[object].push(value);
			const result = await PermissionManager.set(Per);
			if (result instanceof Error) throw result;
			return true;
		} catch (error) {
			return error;
		}
	}

	// 从指定权限组移除成员
	static async remove(object, value) {
		try {
			if (!["blocker", "user", "op"].includes(object)) {
				throw new Error("非法对象");
			}

			const Per = await PermissionManager.get();

			if (!Array.isArray(Per[object])) {
				Per[object] = [];
			}

			// 过滤掉目标成员
			Per[object] = Per[object].filter(item => item !== value);

			const result = await PermissionManager.set(Per);
			if (result instanceof Error) throw result;
			return true;
		} catch (error) {
			return error;
		}
	}

	// 查询成员权限等级
	// 按 op > blocker > user > normal 优先级返回最高权限
	// 返回值: "Blocker" / "User" / "OP" / "Normal"（无权限）
	static async query(queried) {
		try {
			const Per = await PermissionManager.get();

			if (Per["op"].includes(queried)) {
				return "OP";
			}

			if (Per["blocker"].includes(queried)) {
				return "Blocker";
			}

			if (Per["user"].includes(queried)) {
				return "User";
			}

			return "Normal";
		} catch (e) {
			return e;
		}
	}
}

module.exports = PermissionManager;
