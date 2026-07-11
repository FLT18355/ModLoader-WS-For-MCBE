const { commandPrefix } = require("../config");

class Command {
	static commandPrefix = commandPrefix;

	static setCommandPrefix(text) {
		if (text.includes(" ")) return false;
		Command.commandPrefix = text;
	}

	static parseArgs(input) {
		const tokens = [];
		let cur = '',
			inQuote = false;
		for (let i = 0; i < input.length; i++) {
			const ch = input[i];
			if (ch === '"') {
				if (inQuote) tokens.push(cur), cur = '';
				inQuote = !inQuote;
			} else if (!inQuote && ch === ' ') {
				if (cur) tokens.push(cur), cur = '';
			} else {
				cur += ch;
			}
		}
		if (cur) tokens.push(cur);
		if (inQuote) throw new Error('未闭合的双引号');
		return tokens;
	}

	static create(name, description = null) {
		return new Command(name, description);
	}

	constructor(name, description) {
		this.name = name;
		this.description = description;
		this.parameters = [];
		this.func = null;
	}

	addBoolean(description = null) {
		this.parameters.push(["Boolean", description]);
		return this;
	}

	addString(description = null) {
		this.parameters.push(["String", description]);
		return this;
	}

	addInteger(description = null) {
		this.parameters.push(["Integer", description]);
		return this;
	}

	addFloat(description = null) {
		this.parameters.push(["Float", description]);
		return this;
	}

	addEnum(e, description = null) {
		if (typeof e !== "object") return;
		this.parameters.push([e, description]);
		return this;
	}

	add(type, description = null) {
		this.parameters.push([type, description]);
		return this;
	}

	setFunc(func) {
		this.func = func;
		return this;
	}

	execute(commander, text) {
		let textList;

		try {
			textList = Command.parseArgs(text);
		} catch (e) {
			return {
				status: false,
				message: e.message
			};
		}

		if (textList[0] !== `${Command.commandPrefix}${this.name}`) return false;

		if (textList.length !== this.parameters.length + 1) return {
			status: false,
			message: "字符长度不匹配"
		};

		const resultList = [];

		for (let i = 1; i <= this.parameters.length; i++) {
			const nowText = textList[i];
			const nowType = this.parameters[i - 1][0];

			let result;

			if (typeof nowType === "object") {
				if (!nowType.includes(nowText)) return {
					status: false,
					message: `"${nowText}" 处应为枚举 ${nowType}`
				};

				result = nowText;

				resultList.push(result);

				continue;
			}

			if (typeof nowType !== "string") return {
				status: false,
				message: `未知错误`
			};

			switch (nowType) {
				case "Boolean": {
					if (!["true", "false"].includes(nowText)) return {
						status: false,
						message: `"${nowText}" 处应为布尔型`
					};

					if (nowText === "true") result = true;
					if (nowText === "false") result = false;
					break;
				}

				case "String": {
					result = nowText;
					break;
				}

				case "Integer": {
					const num = Number(nowText);
					if (!Number.isInteger(num)) return {
						status: false,
						message: `"${nowText}" 处应为整型`
					};

					result = num;
					break;
				}

				case "Float": {
					const num = parseFloat(nowText);
					if (isNaN(num)) return {
						status: false,
						message: `"${nowText}" 处应为浮点型`
					};

					result = num;
					break;
				}
			}

			resultList.push(result);
		}

		if (this.func && typeof this.func === "function") {
			try {
				this.func(commander, ...resultList);
			} catch (e) {
				return {
					status: false,
					message: resultList
				};
			}
		}

		return {
			status: true,
			message: resultList
		};
	}
}

module.exports = Command;