const fs = require("fs").promises;

class PermissionManager {
	static async get(object = "all") {
		const content = await fs.readFile("./permission.json", "utf-8");
		const permissions = JSON.parse(content);

		if (object === "all") return permissions;

		if (!["blocker", "user", "op"].includes(object)) {
			throw new Error("非法对象");
		}

		return permissions[object];
	}

	static async set(newPer) {
		try {
			await fs.writeFile("./permission.json", JSON.stringify(newPer, null, 2));
			return true;
		} catch (error) {
			return error;
		}
	}

	static async add(object, value) {
		try {
			if (!["blocker", "user", "op"].includes(object)) {
				throw new Error("非法对象");
			}

			const Per = await PermissionManager.get();

			if (!Array.isArray(Per[object])) {
				Per[object] = [];
			}

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

	static async remove(object, value) {
		try {
			if (!["blocker", "user", "op"].includes(object)) {
				throw new Error("非法对象");
			}

			const Per = await PermissionManager.get();

			if (!Array.isArray(Per[object])) {
				Per[object] = [];
			}

			Per[object] = Per[object].filter(item => item !== value);

			const result = await PermissionManager.set(Per);
			if (result instanceof Error) throw result;
			return true;
		} catch (error) {
			return error;
		}
	}

	static async query(queried) {
		try {
			const Per = await PermissionManager.get();

			if (Per["blocker"].includes(queried)) {
				return "Blocker";
			}
			if (Per["user"].includes(queried)) {
				return "User";
			}

			if (Per["op"].includes(queried)) {
				return "OP";
			}

			return "Normal";
		} catch (e) {
			return e;
		}
	}
}

module.exports = PermissionManager;