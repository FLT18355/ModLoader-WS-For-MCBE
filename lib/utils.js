const shared = require("./shared");
const { v4: uuidv4 } = require("uuid");
const { OPEN: wsOPEN } = require("ws");

class Utils {
	static setMulti(multimap, key, value) {
		if (!multimap.has(key)) {
			multimap.set(key, []);
		}
		multimap.get(key).push(value);
	}

	static splitByBytes(str, maxBytes) {
		const result = [];
		let start = 0;
		while (start < str.length) {
			let end = start + 1;
			while (end <= str.length && Buffer.byteLength(str.slice(start, end), 'utf8') <= maxBytes) {
				end++;
			}
			result.push(str.slice(start, end - 1));
			start = end - 1;
		}
		return result;
	}

	constructor(client) {
		client.runCommand = this.runCommand.bind(this);
		client.subscribe = this.subscribe.bind(this);
		client.tellAll = this.tellAll.bind(this);
		client.tell = this.tell.bind(this);
		this.client = client;
		this.commandBack = new Map();
		this.subscribeBack = new Map();
	}

	runCommandUnsafe(command, func = null) {
		const uuid = uuidv4();

		if (func) this.commandBack.set(uuid, func);

		const cmd = {
			"body": {
				"origin": {
					"type": "player"
				},
				"commandLine": command,
				"version": 17104896
			},
			"header": {
				"requestId": uuid,
				"messagePurpose": "commandRequest",
				"version": 1,
				"messageType": "commandRequest"
			}
		}

		this.client.send(JSON.stringify(cmd), (error) => {
			if (error) return false;
			return true;
		});
	}

	runCommand(command, callback = null) {
		if (typeof command !== "string" || (callback && typeof callback !== "function")) return false;
		if (!this.client || this.client.readyState !== wsOPEN) return false;
		if (Buffer.byteLength(command, 'utf8') >= 462) return false;

		return this.runCommandUnsafe(command, callback);
	}

	subscribe(event, callback = null) {
		if (typeof event !== "string" || (callback && typeof callback !== "function")) return false;
		if (!this.client || this.client.readyState !== wsOPEN) return false;

		Utils.setMulti(this.subscribeBack, event, callback);

		const sub = {
			"body": {
				"eventName": event
			},
			"header": {
				"requestId": uuidv4(),
				"messagePurpose": "subscribe",
				"version": 1,
				"messageType": "commandRequest"
			}
		}

		this.client.send(JSON.stringify(sub), (error) => {
			if (error) return false;
			return true;
		});
	}

	unsubscribe(event) {
		if (typeof event !== "string") return false;
		if (!this.client || this.client.readyState !== wsOPEN) return false;

		const unsub = {
			"body": {
				"eventName": event
			},
			"header": {
				"requestId": uuidv4(),
				"messagePurpose": "unsubscribe",
				"version": 1,
				"messageType": "commandRequest"
			}
		}

		this.client.send(JSON.stringify(unsub), (error) => {
			if (!error) this.subscribeBack.delete(event);

			if (error) return false;
			return true;
		});
	}

	tellAll(msg) {
		Utils.splitByBytes(msg, 420).forEach(m => {
			this.runCommand(`me ${m}`);
		});
	}

	tell(msg, current = "@a", origin = null) {
		if (!origin) {
			origin = `{"text":"* "},{"translate":"commands.origin.external"},{"text":" "}`;
		} else {
			origin = `{"translate":"${origin}"}`;
		}

		Utils.splitByBytes(msg, 300).forEach(m => {
			this.runCommand(`tellraw ${current} {"rawtext":[${origin},{"text":"${m}"}]}`);
		});
	}

	onMessage(data) {
		const purpose = data?.header?.messagePurpose;

		if (purpose === "event") {
			const eventName = data?.header?.eventName;

			if (!this.subscribeBack.has(eventName)) return;

			this.subscribeBack.get(eventName).forEach(func => {
				func(data);
			});
		}

		if (purpose === "commandResponse") {
			const uuid = data?.header?.requestId;

			if (!this.commandBack.has(uuid)) return;

			this.commandBack.get(uuid)(data);

			this.commandBack.delete(uuid);
		}
	}

	destroy() {
		this.client = null;
		this.commandBack.clear();
		this.subscribeBack.clear();
	}
}

module.exports = Utils;